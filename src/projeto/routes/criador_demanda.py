from typing import Annotated

from auth import UserByRole
from database import AsyncSessionDep
from fastapi import APIRouter, Depends, HTTPException, status
from schemas.criador_demanda import CriadorDemanda
from schemas.user import User, UserTypes

router = APIRouter(prefix="/criador-demanda", tags=["Criador de Demanda"])


@router.post("/")
async def criar_criador_demanda(
    session: AsyncSessionDep,
    current_user: Annotated[User, Depends(UserByRole([UserTypes.NAO_DEFINIDO]))],
) -> CriadorDemanda:
    if current_user.tipo_user == UserTypes.ENTREGADOR:
        raise HTTPException(
            status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
            detail="Usuario ja cadastrado como entregador",
        )

    criador = CriadorDemanda(id=current_user.id)
    session.add(criador)
    await session.commit()
    await session.refresh(criador)
    return criador
