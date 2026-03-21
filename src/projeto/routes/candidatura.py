from typing import Annotated

from auth import UserByRole
from database import AsyncSessionDep
from fastapi import APIRouter, Depends
from schemas.candidatura import Candidatura, CandidaturaCreate
from schemas.user import User, UserTypes

router = APIRouter(prefix="/candidatura", tags=["Demand"])


@router.post("/")
async def criar_cadidatura(
    candidatura: CandidaturaCreate,
    session: AsyncSessionDep,
    user: Annotated[User, Depends(UserByRole([UserTypes.ENTREGADOR]))],
) -> Candidatura:
    candidatura_to_create = Candidatura(
        **candidatura.model_dump(), entregador_id=user.id
    )
    session.add(candidatura_to_create)
    await session.commit()
    await session.refresh(candidatura_to_create)
    return candidatura_to_create
