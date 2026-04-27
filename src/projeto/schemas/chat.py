from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlmodel import Field, SQLModel

if TYPE_CHECKING:
    from schemas.criador_demanda import CriadorDemanda
    from schemas.entregador import Entregador


class Chat(SQLModel, table=True):
    id: UUID = Field(primary_key=True)
    candidatura_id: UUID = Field(foreign_key="candidatura.id")
    created_at: datetime = Field(default_factory=datetime.now)


class ChatPublic(SQLModel):
    id: UUID
    candidatura_id: UUID
    demanda_id: UUID
    entregador: "Entregador"
    criador_demanda: "CriadorDemanda"
    created_at: datetime
