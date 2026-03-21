from typing import Annotated

from auth import UserByRole
from database import AsyncSessionDep
from fastapi import APIRouter, Depends, HTTPException, status
from schemas.criador_demanda import CriadorDemanda
from schemas.demand import Demand
from schemas.user import User, UserTypes
from sqlmodel import col, select

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
    current_user.tipo_user = UserTypes.CRIADOR_DEMANDA
    criador = CriadorDemanda(id=current_user.id)
    session.add(criador)
    session.add(current_user)

    await session.commit()
    await session.refresh(criador)
    return criador


@router.get("/demandas")
async def pegar_minhas_demandas(
    session: AsyncSessionDep,
    current_user: Annotated[User, Depends(UserByRole([UserTypes.CRIADOR_DEMANDA]))],
) -> list[Demand]:
    demands = (
        await session.exec(select(Demand).where(col(Demand.user_id) == current_user.id))
    ).all()
    return list(demands)


@router.delete("/")
async def deletar_conta_criador(
    session: AsyncSessionDep,
    current_user: Annotated[
        User,
        Depends(UserByRole(roles=[UserTypes.CRIADOR_DEMANDA, UserTypes.NAO_DEFINIDO])),
    ],
) -> CriadorDemanda:
    criador_profile = (
        await session.exec(
            select(CriadorDemanda).where(col(CriadorDemanda.id) == current_user.id)
        )
    ).first()
    if criador_profile:
        await session.delete(criador_profile)

    current_user.tipo_user = UserTypes.NAO_DEFINIDO
    session.add(current_user)
    await session.commit()
    if not criador_profile:
        raise HTTPException(
            status_code=status.HTTP_410_GONE, detail="Entregador ja deletado"
        )
    return criador_profile
