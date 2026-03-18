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
    entregador_id: UUID = Field(foreign_key="user.id")
    mensagem: str | None = None
    status: CandidaturaStatus = CandidaturaStatus.PENDENTE


class Candidatura(CandidaturaCreate, table=True):
    id: UUID = Field(primary_key=True, default_factory=uuid4)
    created_at: datetime = Field(default_factory=datetime.now)