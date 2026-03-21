from typing import Annotated

from auth import get_current_user, get_password_hash
from database import AsyncSessionDep
from fastapi import APIRouter, Depends, HTTPException, status
from schemas.criador_demanda import CriadorDemandaPublic
from schemas.entregador import EntregadorPublic
from schemas.user import User, UserCreate, UserPublic
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

router = APIRouter(prefix="/user", tags=["User"])


@router.post("/")
async def post_user(user: UserCreate, session: AsyncSessionDep) -> UserCreate:
    user_new = User(**user.model_dump())
    user_new.password = get_password_hash(user.password)
    try:
        session.add(user_new)
        await session.commit()
        await session.refresh(user_new)
    except IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Usuario com o nome ja cadastrado",
        ) from e
    return user_new


@router.get("/")
async def get_user(
    session: AsyncSessionDep, current_user: Annotated[User, Depends(get_current_user)]
) -> list[User]:
    return list((await session.exec(select(User))).fetchall())


@router.get("/profile")
async def get_user_profile(
    session: AsyncSessionDep, current_user: Annotated[User, Depends(get_current_user)]
) -> UserPublic:
    return UserPublic(
        **current_user.model_dump(),
        criador_demanda=CriadorDemandaPublic(
            **current_user.criador_demanda.model_dump()
        )
        if current_user.criador_demanda
        else None,
        entregador=EntregadorPublic(**current_user.entregador.model_dump())
        if current_user.entregador
        else None,
    )
