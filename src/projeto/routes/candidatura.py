from typing import Annotated
from uuid import UUID

from auth import UserByRole
from database import AsyncSessionDep
from fastapi import APIRouter, Depends, HTTPException, status
from schemas.candidatura import (
    Candidatura,
    CandidaturaComDemanda,
    CandidaturaCreate,
    CandidaturaEntregadorInfo,
    CandidaturaPublic,
    CandidaturaStatus,
    DemandaResumo,
)
from schemas.demand import Demand, DemandStatus
from schemas.entregador import Entregador
from schemas.user import User, UserTypes
from sqlmodel import col, select

router = APIRouter(prefix="/candidatura", tags=["Candidatura"])


@router.post("/")
async def criar_cadidatura(
    candidatura: CandidaturaCreate,
    session: AsyncSessionDep,
    user: Annotated[User, Depends(UserByRole([UserTypes.ENTREGADOR]))],
) -> Candidatura:
    """
    Candidatura, apenas os entregadores podem se candidatar.
    """
    candidatura_to_create = Candidatura(
        **candidatura.model_dump(), entregador_id=user.id
    )
    session.add(candidatura_to_create)
    await session.commit()
    await session.refresh(candidatura_to_create)
    return candidatura_to_create


# IMPORTANTE: esta rota deve ficar ANTES de /{demanda_id} para não colidir
@router.get("/minhas")
async def listar_minhas_candidaturas(
    session: AsyncSessionDep,
    current_user: Annotated[User, Depends(UserByRole([UserTypes.ENTREGADOR]))],
) -> list[CandidaturaComDemanda]:
    """
    Lista todas as candidaturas feitas pelo entregador autenticado,
    com informações resumidas de cada demanda.
    """
    candidaturas = list(
        (
            await session.exec(
                select(Candidatura).where(Candidatura.entregador_id == current_user.id)
            )
        ).fetchall()
    )

    result: list[CandidaturaComDemanda] = []
    for cand in candidaturas:
        demand = (
            await session.exec(select(Demand).where(Demand.id == cand.demanda_id))
        ).first()

        if not demand:
            continue

        result.append(
            CandidaturaComDemanda(
                id=cand.id,
                mensagem=cand.mensagem,
                status=cand.status,
                created_at=cand.created_at,
                demanda=DemandaResumo(
                    id=demand.id,
                    title=demand.title,
                    endereco_origem=demand.endereco_origem,
                    endereco_destino=demand.endereco_destino,
                    status=demand.status,
                    valor_proposto=demand.valor_proposto,
                    peso_carga_kg=demand.peso_carga_kg,
                ),
            )
        )

    return result


@router.get("/{demanda_id}")
async def listar_candidaturas(
    demanda_id: UUID,
    session: AsyncSessionDep,
    current_user: Annotated[User, Depends(UserByRole([UserTypes.CRIADOR_DEMANDA]))],
) -> list[CandidaturaPublic]:
    """
    Lista os candidatos de uma demanda. Apenas o dono da demanda pode consultar.
    """
    demand = (await session.exec(select(Demand).where(Demand.id == demanda_id))).first()

    if not demand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Demanda não encontrada"
        )

    if demand.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para ver estas candidaturas",
        )

    candidaturas = list(
        (
            await session.exec(
                select(Candidatura).where(Candidatura.demanda_id == demanda_id)
            )
        ).fetchall()
    )

    result: list[CandidaturaPublic] = []
    for cand in candidaturas:
        entregador_user = (
            await session.exec(select(User).where(User.id == cand.entregador_id))
        ).first()
        entregador = (
            await session.exec(
                select(Entregador).where(Entregador.id == cand.entregador_id)
            )
        ).first()

        if not entregador_user or not entregador:
            continue

        result.append(
            CandidaturaPublic(
                id=cand.id,
                demanda_id=cand.demanda_id,
                mensagem=cand.mensagem,
                status=cand.status,
                created_at=cand.created_at,
                entregador=CandidaturaEntregadorInfo(
                    id=entregador_user.id,
                    nome=entregador_user.nome,
                    telefone=entregador_user.telefone,
                    tipo_veiculo=entregador.tipo_veiculo,
                    placa_veiculo=entregador.placa_veiculo,
                    capacidade_kg=entregador.capacidade_kg,
                    avaliacao_media=entregador.avaliacao_media,
                ),
            )
        )

    return result


@router.put("/aceitar/{candidatura_id}")
async def aceitar_candidatura(
    id_candidatura: UUID,
    session: AsyncSessionDep,
    current_user: Annotated[User, Depends(UserByRole([UserTypes.CRIADOR_DEMANDA]))],
) -> Candidatura:
    candidatura = (
        await session.exec(
            select(Candidatura).where(col(Candidatura.id) == id_candidatura)
        )
    ).first()
    if not candidatura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidatura não encontrada"
        )
    demand = (
        await session.exec(
            select(Demand).where(col(Demand.id) == candidatura.demanda_id)
        )
    ).first()
    if not demand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidatura não encontrada"
        )
    if demand.status == DemandStatus.EM_ANDAMENTO:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Demanda ja em andamento"
        )
    if demand.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Não pertencente ao usuario",
        )
    candidatura.status = CandidaturaStatus.ACEITA
    demand.status = DemandStatus.EM_ANDAMENTO
    session.add(candidatura)

    await session.commit()

    return candidatura
