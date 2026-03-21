from typing import Annotated
from uuid import UUID

from auth import UserByRole, get_current_user
from database import AsyncSessionDep
from fastapi import APIRouter, Depends, HTTPException, status
from schemas.demand import Demand, DemandCreate
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
    try:
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
    current_user: Annotated[User, Depends(UserByRole([UserTypes.CRIADOR_DEMANDA]))],
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
