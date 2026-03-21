from typing import Annotated

from auth import get_current_user, get_password_hash
from database import AsyncSessionDep
from fastapi import APIRouter, Depends, HTTPException, status
from schemas.criador_demanda import CriadorDemanda, CriadorDemandaPublic
from schemas.entregador import Entregador, EntregadorPublic
from schemas.user import User, UserCreate, UserPublic, UserTypes
from sqlalchemy.exc import IntegrityError
from sqlmodel import col, select

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
    user_public = UserPublic(**current_user.model_dump())
    if current_user.tipo_user == UserTypes.CRIADOR_DEMANDA:
        criador_profile = (
            await session.exec(
                select(CriadorDemanda).where(col(CriadorDemanda.id) == current_user.id)
            )
        ).first()
        if not criador_profile:
            return user_public
        user_public.criador_demanda = CriadorDemandaPublic(
            **criador_profile.model_dump()
        )

    if current_user.tipo_user == UserTypes.ENTREGADOR:
        entregador_profile = (
            await session.exec(
                select(Entregador).where(col(Entregador.id) == current_user.id)
            )
        ).first()
        if not entregador_profile:
            return user_public
        user_public.entregador = EntregadorPublic(**entregador_profile.model_dump())

    return user_public
