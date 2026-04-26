from typing import Annotated
from uuid import UUID

from auth import UserByRole, get_current_user
from database import AsyncSessionDep
from fastapi import APIRouter, Depends, HTTPException, status
from schemas.demand import Demand, DemandCreate, DemandStatus
from schemas.user import User, UserTypes
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

router = APIRouter(prefix="/demand", tags=["Demand"])


@router.post("/")
async def post_demand(
    demanda: DemandCreate,
    session: AsyncSessionDep,
    current_user: Annotated[User, Depends(UserByRole([UserTypes.CRIADOR_DEMANDA]))],
) -> Demand:
    demanda_new = Demand(**demanda.model_dump(), user_id=current_user.id)
    # criador = (
    #     await session.exec(
    #         select(CriadorDemanda).where(col(CriadorDemanda.id) == current_user.id)
    #     )
    # ).first()
    try:
        # if criador:
        #     criador.total_demandas += 1
        #     session.add(criador)
        current_user.criador_demanda.total_demandas += 1
        session.add(demanda_new)
        await session.commit()
        await session.refresh(demanda_new)
    except IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Erro ao criar demanda",
        ) from e
    return demanda_new


@router.get("/")
async def get_demand(
    session: AsyncSessionDep,
    current_user: Annotated[
        User, Depends(UserByRole([UserTypes.CRIADOR_DEMANDA, UserTypes.ENTREGADOR]))
    ],
) -> list[Demand]:
    return list((await session.exec(select(Demand))).fetchall())


@router.get("/{demand_id}")
async def get_demand_by_id(
    demand_id: UUID,
    session: AsyncSessionDep,
    current_user: Annotated[User, Depends(get_current_user)],
) -> Demand:
    demand = (await session.exec(select(Demand).where(Demand.id == demand_id))).first()

    if not demand:
        raise HTTPException(status_code=404, detail="Demand not found")

    return demand


# Rota para cancelar a demanda
@router.put("/cancelar/{demanda_id}")
async def cancelar_demanda(
    demanda_id: UUID,
    session: AsyncSessionDep,
    current_user: Annotated[User, Depends(UserByRole([UserTypes.CRIADOR_DEMANDA]))],
) -> Demand:
    """
    Cancela uma demanda
    """
    demand = (await session.exec(select(Demand).where(Demand.id == demanda_id))).first()
    if not demand:
        raise HTTPException(status_code=404, detail="Demanda não encontrada")

    if demand.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não é o dono da demanda para cancelar",
        )

    demand.status = DemandStatus.CANCELADA
    session.add(demand)
    await session.commit()
    await session.refresh(demand)

    return demand


@router.put("/aceitar/{demanda_id}")
async def aceitar_demanda(
    demanda_id: UUID,
    session: AsyncSessionDep,
    current_user: Annotated[User, Depends(UserByRole([UserTypes.CRIADOR_DEMANDA]))],
) -> Demand:
    """
    Aceita uma demanda e deixa essa demanda em andamento
    """
    demand = (await session.exec(select(Demand).where(Demand.id == demanda_id))).first()
    if not demand:
        raise HTTPException(status_code=404, detail="Demanda não encontrada")

    if demand.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não é o dono da demanda para cancelar",
        )

    demand.status = DemandStatus.EM_ANDAMENTO
    session.add(demand)
    await session.commit()
    await session.refresh(demand)

    return demand
