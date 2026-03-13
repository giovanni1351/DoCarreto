from typing import Annotated

from auth import get_current_user
from database import AsyncSessionDep
from fastapi import APIRouter, Depends, HTTPException, status
from schemas.demand import Demand, DemandCreate
from schemas.user import User
from sqlalchemy.exc import IntegrityError

router = APIRouter(prefix="/demand", tags=["Demand"])


@router.post("/")
async def post_demand(
    demanda: DemandCreate,
    session: AsyncSessionDep,
    current_user: Annotated[User, Depends(get_current_user)],
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
