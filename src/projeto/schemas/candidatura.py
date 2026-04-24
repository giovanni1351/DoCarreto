from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4

from pydantic import BaseModel
from sqlmodel import Field, SQLModel  # pyright: ignore[reportUnknownVariableType]


class CandidaturaStatus(Enum):
    PENDENTE = "pendente"
    ACEITA = "aceita"
    RECUSADA = "recusada"


class CandidaturaCreate(SQLModel):
    demanda_id: UUID = Field(foreign_key="demand.id")
    mensagem: str | None = None


class Candidatura(CandidaturaCreate, table=True):
    id: UUID = Field(primary_key=True, default_factory=uuid4)
    entregador_id: UUID = Field(foreign_key="user.id")
    status: CandidaturaStatus = CandidaturaStatus.PENDENTE

    created_at: datetime = Field(default_factory=datetime.now)


class CandidaturaEntregadorInfo(BaseModel):
    id: UUID
    nome: str | None
    telefone: str
    tipo_veiculo: str | None
    placa_veiculo: str | None
    capacidade_kg: float | None
    avaliacao_media: float


class CandidaturaPublic(BaseModel):
    id: UUID
    demanda_id: UUID
    mensagem: str | None
    status: CandidaturaStatus
    created_at: datetime
    entregador: CandidaturaEntregadorInfo


class DemandaResumo(BaseModel):
    id: UUID
    title: str
    endereco_origem: str
    endereco_destino: str
    status: str
    valor_proposto: float
    peso_carga_kg: float


class CandidaturaComDemanda(BaseModel):
    id: UUID
    mensagem: str | None
    status: CandidaturaStatus
    created_at: datetime
    demanda: DemandaResumo
