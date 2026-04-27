from typing import Annotated
from uuid import UUID

from auth import UserByRole
from database import AsyncSessionDep, async_engine
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from manager.conection import ConnectionManager
from schemas.candidatura import Candidatura
from schemas.chat import Chat
from schemas.demand import Demand
from schemas.mensagens import Mensagem
from schemas.user import User, UserTypes
from sqlmodel import col, or_, select
from sqlmodel.ext.asyncio.session import AsyncSession
from utils.chat import autenticar_websocket, verificar_acesso_chat

router = APIRouter(prefix="/chat", tags=["Chat"])


manager = ConnectionManager()


@router.get("/")
async def get_all_chats(
    session: AsyncSessionDep,
    current_user: Annotated[
        User, Depends(UserByRole([UserTypes.CRIADOR_DEMANDA, UserTypes.ENTREGADOR]))
    ],
) -> list[Chat]:

    chats = (
        await session.exec(
            select(Chat, Candidatura, Demand)
            .where(
                or_(
                    Demand.user_id == current_user.id,
                    Candidatura.entregador_id == current_user.id,
                )
            )
            .join(Candidatura, col(Chat.candidatura_id) == Candidatura.id)
            .join(Demand, col(Candidatura.demanda_id) == Demand.id)
        )
    ).all()

    return [result[0] for result in chats]


# ---------------------------------------------------------------------------
# WebSocket — ws://.../chat/conversar/{chat_id}?token=JWT
# ---------------------------------------------------------------------------


@router.websocket("/conversar/{chat_id}")
async def conversar(
    websocket: WebSocket,
    chat_id: UUID,
    token: str = Query(..., description="JWT de autenticação"),
) -> None:
    """
    WebSocket de chat em tempo real entre criador de demanda e entregador.

    Conexão: ws://<host>/chat/conversar/{chat_id}?token=<JWT>

    Ao conectar:
      - Autentica o usuário via JWT
      - Verifica que o usuário pertence ao chat (criador ou entregador)
      - Envia o histórico completo de mensagens do chat
      - Mensagens não lidas recebidas pelo outro participante são marcadas como lidas

    Loop de mensagens (cliente → servidor):
        { "conteudo": "texto da mensagem" }

    Eventos enviados pelo servidor:
        Nova mensagem:  { "tipo": "mensagem", "id": "...", "remetente_id": "...",
                          "chat_id": "...", "conteudo": "...",
                          "lida": false, "created_at": "2026-01-01T10:00:00" }
        Confirmação de leitura:
                        { "tipo": "lida", "mensagem_id": "..." }
        Erro:           { "tipo": "erro", "detalhe": "..." }
    """
    async with AsyncSession(async_engine, expire_on_commit=False) as session:
        # 1. Autenticação via token JWT no query param
        user = await autenticar_websocket(token, session)
        if user is None:
            await websocket.accept()
            await websocket.send_json(
                {"tipo": "erro", "detalhe": "Token inválido ou expirado"}
            )
            await websocket.close(code=4001)
            return

        # 2. Verificar que o usuário pertence a este chat
        chat = await verificar_acesso_chat(chat_id, user, session)
        if chat is None:
            await websocket.accept()
            await websocket.send_json(
                {"tipo": "erro", "detalhe": "Chat não encontrado ou sem permissão"}
            )
            await websocket.close(code=4003)
            return

        # 3. Registrar conexão
        await manager.connect(chat_id, websocket, user.id)

        try:
            # 4. Enviar histórico completo (em ordem cronológica)
            historico = (
                await session.exec(
                    select(Mensagem)
                    .where(Mensagem.chat_id == chat_id)
                    .order_by(col(Mensagem.created_at))
                )
            ).all()

            msgs_para_marcar_lidas: list[Mensagem] = []

            for msg in historico:
                await websocket.send_json(
                    {
                        "tipo": "mensagem",
                        "id": str(msg.id),
                        "chat_id": str(msg.chat_id),
                        "remetente_id": str(msg.remetente_id),
                        "conteudo": msg.conteudo,
                        "lida": msg.lida,
                        "created_at": msg.created_at.isoformat(),
                    }
                )
                # Mensagens enviadas pelo outro participante e ainda não lidas
                if msg.remetente_id != user.id and not msg.lida:
                    msgs_para_marcar_lidas.append(msg)

            # Marcar como lidas em batch e notificar
            if msgs_para_marcar_lidas:
                for msg in msgs_para_marcar_lidas:
                    msg.lida = True
                    session.add(msg)
                await session.commit()

                for msg in msgs_para_marcar_lidas:
                    lida_event = {"tipo": "lida", "mensagem_id": str(msg.id)}
                    room = manager.get_room(chat_id)
                    for ws, _ in room:
                        try:
                            await ws.send_json(lida_event)
                        except Exception:
                            pass

            # 5. Loop de recebimento de novas mensagens
            while True:
                data = await websocket.receive_json()

                conteudo: str = (data.get("conteudo") or "").strip()
                if not conteudo:
                    await websocket.send_json(
                        {"tipo": "erro", "detalhe": "Conteúdo não pode ser vazio"}
                    )
                    continue

                # Persistir no banco
                nova_mensagem = Mensagem(
                    chat_id=chat_id,
                    remetente_id=user.id,
                    conteudo=conteudo,
                )
                session.add(nova_mensagem)
                await session.commit()
                await session.refresh(nova_mensagem)

                # Broadcast para todos no chat (+ lógica de lida automática)
                payload = {
                    "tipo": "mensagem",
                    "id": str(nova_mensagem.id),
                    "chat_id": str(nova_mensagem.chat_id),
                    "remetente_id": str(nova_mensagem.remetente_id),
                    "conteudo": nova_mensagem.conteudo,
                    "lida": nova_mensagem.lida,
                    "created_at": nova_mensagem.created_at.isoformat(),
                }
                await manager.broadcast(chat_id, payload, user.id, session)

        except WebSocketDisconnect:
            manager.disconnect(chat_id, websocket)

        except Exception as exc:
            manager.disconnect(chat_id, websocket)
            try:
                await websocket.send_json({"tipo": "erro", "detalhe": str(exc)})
                await websocket.close(code=1011)
            except Exception:
                pass
