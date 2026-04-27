from typing import Annotated
from uuid import UUID

from auth import UserByRole
from database import AsyncSessionDep
from fastapi import APIRouter, Depends, HTTPException, status
from schemas.candidatura import Candidatura
from schemas.chat import Chat
from schemas.demand import Demand
from schemas.mensagens import Mensagem
from schemas.user import User, UserTypes
from sqlmodel import col, or_, select

router = APIRouter(prefix="/mensagens", tags=["Demand"])


@router.get("/{chat_id}")
async def get_demand_by_id(
    chat_id: UUID,
    session: AsyncSessionDep,
    current_user: Annotated[
        User, Depends(UserByRole([UserTypes.CRIADOR_DEMANDA, UserTypes.ENTREGADOR]))
    ],
) -> list[Mensagem]:

    chat = (
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
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found"
        )
    mensagens = (
        await session.exec(select(Mensagem).where(Mensagem.chat_id == chat_id))
    ).all()

    return list(mensagens)
