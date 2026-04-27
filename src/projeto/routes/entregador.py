from typing import Annotated

from auth import UserByRole
from database import AsyncSessionDep
from fastapi import APIRouter, Depends, HTTPException, status
from schemas.candidatura import Candidatura
from schemas.demand import Demand, DemandStatus
from schemas.entregador import Entregador, EntregadorCreate
from schemas.user import User, UserTypes
from sqlmodel import and_, col, or_, select

router = APIRouter(prefix="/entregador", tags=["Entregador"])


@router.post("/")
async def criar_entregador(
    entregador_data: EntregadorCreate,
    session: AsyncSessionDep,
    current_user: Annotated[User, Depends(UserByRole(roles=[UserTypes.NAO_DEFINIDO]))],
) -> Entregador:
    if current_user.tipo_user == UserTypes.ENTREGADOR:
        raise HTTPException(
            status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
            detail="Usuario ja cadastrado como entregador",
        )

    criador = Entregador(id=current_user.id, **entregador_data.model_dump())
    current_user.tipo_user = UserTypes.ENTREGADOR
    session.add(criador)
    session.add(current_user)
    await session.commit()
    await session.refresh(criador)
    return criador


@router.delete("/")
async def deletar_conta_entregador(
    session: AsyncSessionDep,
    current_user: Annotated[
        User,
        Depends(UserByRole(roles=[UserTypes.ENTREGADOR, UserTypes.NAO_DEFINIDO])),
    ],
) -> Entregador:
    entregador_profile = (
        await session.exec(
            select(Entregador).where(col(Entregador.id) == current_user.id)
        )
    ).first()
    if entregador_profile:
        await session.delete(entregador_profile)

    current_user.tipo_user = UserTypes.NAO_DEFINIDO
    session.add(current_user)
    await session.commit()
    if not entregador_profile:
        raise HTTPException(
            status_code=status.HTTP_410_GONE, detail="Entregador ja deletado"
        )
    return entregador_profile


@router.get("/demandas")
async def get_entreagdor_demandas(
    session: AsyncSessionDep,
    current_user: Annotated[User, Depends(UserByRole([UserTypes.ENTREGADOR]))],
) -> list[Demand]:
    demandas = list(
        (
            await session.exec(
                select(Demand, Candidatura)
                .where(
                    or_(
                        and_(
                            col(Demand.status) != DemandStatus.CANCELADA,
                            col(Demand.status) != DemandStatus.EM_ANDAMENTO,
                        ),
                        col(Candidatura.entregador_id) == current_user.id,
                    ),
                )
                .join(Candidatura, isouter=True)
            )
        ).fetchall()
    )
    return [demanda_candidatura[0] for demanda_candidatura in demandas]
