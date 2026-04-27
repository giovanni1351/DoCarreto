from datetime import datetime
from uuid import UUID

from sqlmodel import Field, SQLModel


class Chat(SQLModel, table=True):
    id: UUID = Field(primary_key=True)
    candidatura_id: UUID = Field(foreign_key="candidatura.id")
    created_at: datetime = Field(default_factory=datetime.now)


class ChatPublic(SQLModel):
    id: UUID
    candidatura_id: UUID
    demanda_id: UUID
    demanda_titulo: str
    demanda_origem: str
    demanda_destino: str
    entregador_nome: str | None
    criador_nome: str | None
    created_at: datetime
