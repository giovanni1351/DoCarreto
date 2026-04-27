from typing import Annotated
from uuid import UUID

from auth import UserByRole
from database import AsyncSessionDep
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from schemas.candidatura import Candidatura
from schemas.chat import Chat
from schemas.demand import Demand
from schemas.mensagens import Mensagem, MensagemPublic
from schemas.user import User, UserTypes
from sqlmodel import col, or_, select

router = APIRouter(prefix="/mensagens", tags=["Mensagens"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_chat_com_acesso(
    chat_id: UUID,
    current_user: User,
    session: AsyncSessionDep,
) -> Chat:
    """Retorna o Chat se o usuário tem acesso, lança 404 caso contrário."""
    result = (
        await session.exec(
            select(Chat, Candidatura, Demand)
            .where(
                col(Chat.id) == chat_id,
                or_(
                    Demand.user_id == current_user.id,
                    Candidatura.entregador_id == current_user.id,
                ),
            )
            .join(Candidatura, col(Chat.candidatura_id) == Candidatura.id)
            .join(Demand, col(Candidatura.demanda_id) == Demand.id)
        )
    ).first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat não encontrado ou sem permissão",
        )
    return result[0]


# ---------------------------------------------------------------------------
# GET /mensagens/{chat_id} — listar mensagens do chat
# ---------------------------------------------------------------------------

@router.get("/{chat_id}", response_model=list[MensagemPublic])
async def get_mensagens(
    chat_id: UUID,
    session: AsyncSessionDep,
    current_user: Annotated[
        User, Depends(UserByRole([UserTypes.CRIADOR_DEMANDA, UserTypes.ENTREGADOR]))
    ],
) -> list[Mensagem]:

    await _get_chat_com_acesso(chat_id, current_user, session)

    mensagens = (
        await session.exec(
            select(Mensagem)
            .where(Mensagem.chat_id == chat_id)
            .order_by(col(Mensagem.created_at))
        )
    ).all()

    return list(mensagens)


# ---------------------------------------------------------------------------
# POST /mensagens/{chat_id} — enviar mensagem via REST (fallback HTTP)
# ---------------------------------------------------------------------------

class MensagemCreate(BaseModel):
    conteudo: str


@router.post("/{chat_id}", response_model=MensagemPublic, status_code=status.HTTP_201_CREATED)
async def enviar_mensagem(
    chat_id: UUID,
    body: MensagemCreate,
    session: AsyncSessionDep,
    current_user: Annotated[
        User, Depends(UserByRole([UserTypes.CRIADOR_DEMANDA, UserTypes.ENTREGADOR]))
    ],
) -> Mensagem:

    await _get_chat_com_acesso(chat_id, current_user, session)

    conteudo = body.conteudo.strip()
    if not conteudo:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Conteúdo não pode ser vazio",
        )

    nova_mensagem = Mensagem(
        chat_id=chat_id,
        remetente_id=current_user.id,
        conteudo=conteudo,
    )
    session.add(nova_mensagem)
    await session.commit()
    await session.refresh(nova_mensagem)

    return nova_mensagem


# ---------------------------------------------------------------------------
# PUT /mensagens/lida/{mensagem_id} — marcar mensagem como lida (REST manual)
# ---------------------------------------------------------------------------

@router.put("/lida/{mensagem_id}", response_model=MensagemPublic)
async def marcar_como_lida(
    mensagem_id: UUID,
    session: AsyncSessionDep,
    current_user: Annotated[
        User, Depends(UserByRole([UserTypes.CRIADOR_DEMANDA, UserTypes.ENTREGADOR]))
    ],
) -> Mensagem:

    mensagem = await session.get(Mensagem, mensagem_id)
    if not mensagem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mensagem não encontrada",
        )

    # Garante que o usuário tem acesso ao chat desta mensagem
    await _get_chat_com_acesso(mensagem.chat_id, current_user, session)

    # Apenas o destinatário pode marcar como lida (não o próprio remetente)
    if mensagem.remetente_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não pode marcar sua própria mensagem como lida",
        )

    mensagem.lida = True
    session.add(mensagem)
    await session.commit()
    await session.refresh(mensagem)

    return mensagem
