from typing import Annotated

from auth import UserByRole
from database import AsyncSessionDep
from fastapi import APIRouter, Depends
from schemas.candidatura import Candidatura
from schemas.chat import Chat
from schemas.demand import Demand
from schemas.user import User, UserTypes
from sqlmodel import col, or_, select

router = APIRouter(prefix="/chat", tags=["Demand"])


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
                ),
            )
            .join(Candidatura, col(Chat.candidatura_id) == Candidatura.id)
            .join(Demand, col(Candidatura.demanda_id) == Demand.id)
        )
    ).all()

    return [result[0] for result in chats]
