from uuid import UUID

from fastapi import WebSocket
from schemas.mensagens import Mensagem
from sqlmodel.ext.asyncio.session import AsyncSession


class ConnectionManager:
    def __init__(self) -> None:
        # chat_id -> list de (websocket, user_id)
        self._connections: dict[UUID, list[tuple[WebSocket, UUID]]] = {}

    def get_room(self, chat_id: UUID) -> list[tuple[WebSocket, UUID]]:
        return self._connections.setdefault(chat_id, [])

    async def connect(self, chat_id: UUID, websocket: WebSocket, user_id: UUID) -> None:
        await websocket.accept()
        self.get_room(chat_id).append((websocket, user_id))

    def disconnect(self, chat_id: UUID, websocket: WebSocket) -> None:
        room = self.get_room(chat_id)
        self._connections[chat_id] = [
            (ws, uid) for ws, uid in room if ws is not websocket
        ]

    async def broadcast(
        self,
        chat_id: UUID,
        payload: dict,
        sender_id: UUID,
        session: AsyncSession,
    ) -> None:
        """Envia o payload para todos os participantes do chat.
        Se o destinatário (não-remetente) estiver conectado, marca a mensagem como lida
        e notifica todos sobre a leitura."""
        room = self.get_room(chat_id)
        mensagem_id: UUID | None = payload.get("id")  # type: ignore[assignment]

        destinatario_conectado = any(uid != sender_id for _, uid in room)

        for ws, _ in room:
            try:
                await ws.send_json(payload)
            except Exception:
                pass

        # Se o destinatário está conectado → marca como lida e notifica
        if destinatario_conectado and mensagem_id is not None:
            mensagem = await session.get(Mensagem, mensagem_id)
            if mensagem and not mensagem.lida:
                mensagem.lida = True
                session.add(mensagem)
                await session.commit()

                lida_event = {"tipo": "lida", "mensagem_id": str(mensagem_id)}
                for ws, _ in room:
                    try:
                        await ws.send_json(lida_event)
                    except Exception:
                        pass
