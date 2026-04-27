from typing import Annotated
from uuid import UUID

from auth import UserByRole, get_current_user
from database import AsyncSessionDep
from fastapi import APIRouter, Depends, HTTPException, status
from schemas.candidatura import Candidatura
from schemas.demand import Demand, DemandCreate, DemandStatus, DemandUpdate
from schemas.user import User, UserTypes
from sqlalchemy.exc import IntegrityError
from sqlmodel import and_, col, delete, select

router = APIRouter(prefix="/demand", tags=["Demand"])


@router.post("/")
async def post_demand(
    demanda: DemandCreate,
    session: AsyncSessionDep,
    current_user: Annotated[User, Depends(UserByRole([UserTypes.CRIADOR_DEMANDA]))],
) -> Demand:
    demanda_new = Demand(**demanda.model_dump(), user_id=current_user.id)
    try:
        current_user.criador_demanda.total_demandas += 1  # type: ignore
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
    return list(
        (
            await session.exec(
                select(Demand).where(
                    and_(
                        col(Demand.status) != DemandStatus.CANCELADA,
                        col(Demand.status) != DemandStatus.EM_ANDAMENTO,
                    )
                )
            )
        ).fetchall()
    )


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
        msg = "Demanda não encontrada"
        raise HTTPException(status_code=404, detail=msg)

    if demand.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não é o dono da demanda para cancelar",
        )

    demand.status = DemandStatus.CANCELADA
    session.add(demand)
    await session.exec(
        delete(Candidatura).where(
            col(Candidatura.demanda_id) == demand.id,
        )
    )
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


@router.put("/{demanda_id}")
async def atualizar_demanda(
    demanda_id: UUID,
    demanda_update: DemandUpdate,
    session: AsyncSessionDep,
    current_user: Annotated[User, Depends(UserByRole([UserTypes.CRIADOR_DEMANDA]))],
) -> Demand:
    """
    Atualizar registros da demanda.
    """
    demand = (await session.exec(select(Demand).where(Demand.id == demanda_id))).first()
    if not demand:
        raise HTTPException(status_code=404, detail="Demanda não encontrada")

    if demand.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não é o dono da demanda para cancelar",
        )

    if demanda_update.title is not None:
        demand.title = demanda_update.title
    if demanda_update.description is not None:
        demand.description = demanda_update.description
    if demanda_update.endereco_origem is not None:
        demand.endereco_origem = demanda_update.endereco_origem
    if demanda_update.lat_origem is not None:
        demand.lat_origem = demanda_update.lat_origem
    if demanda_update.lon_origem is not None:
        demand.lon_origem = demanda_update.lon_origem
    if demanda_update.endereco_destino is not None:
        demand.endereco_destino = demanda_update.endereco_destino
    if demanda_update.lat_destino is not None:
        demand.lat_destino = demanda_update.lat_destino
    if demanda_update.lon_destino is not None:
        demand.lon_destino = demanda_update.lon_destino
    if demanda_update.valor_proposto is not None:
        demand.valor_proposto = demanda_update.valor_proposto
    if demanda_update.peso_carga_kg is not None:
        demand.peso_carga_kg = demanda_update.peso_carga_kg
    if demanda_update.data_coleta is not None:
        demand.data_coleta = demanda_update.data_coleta
    session.add(demand)
    await session.commit()
    await session.refresh(demand)

    return demand
