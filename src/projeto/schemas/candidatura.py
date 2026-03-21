from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4

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
