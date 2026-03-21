from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel
from sqlmodel import (  # pyright: ignore[reportUnknownVariableType]
    Field,
    Relationship,
    SQLModel,
)

if TYPE_CHECKING:
    from schemas.criador_demanda import CriadorDemanda, CriadorDemandaPublic
    from schemas.entregador import Entregador, EntregadorPublic


class UserTypes(Enum):
    CRIADOR_DEMANDA = "CRIADOR_DEMANDA"
    ENTREGADOR = "ENTREGADOR"
    NAO_DEFINIDO = "NAO_DEFINIDO"


class UserCreate(SQLModel):
    nome: str | None = None
    email: str = Field(unique=True)
    password: str
    telefone: str


class User(UserCreate, table=True):
    id: UUID = Field(primary_key=True, default_factory=uuid4)
    is_admin: bool = Field(default=False)
    tipo_user: "UserTypes" = UserTypes.NAO_DEFINIDO

    criador_demanda: Optional["CriadorDemanda"] = Relationship(back_populates="user")
    entregador: Optional["Entregador"] = Relationship(back_populates="user")

    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime | None = Field(default=None)
    deleted_at: datetime | None = Field(default=None)


class UserPublic(BaseModel):
    id: UUID | None
    is_admin: bool | None
    tipo_user: Optional["UserTypes"]
    nome: str | None
    email: str | None
    password: str | None
    telefone: str | None

    criador_demanda: "CriadorDemandaPublic | None" = None
    entregador: "EntregadorPublic | None" = None

    created_at: datetime
    updated_at: datetime | None
    deleted_at: datetime | None
