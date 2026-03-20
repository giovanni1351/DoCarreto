from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import (  # pyright: ignore[reportUnknownVariableType]
    Field,
    Relationship,
    SQLModel,
)


class UserTypes(Enum):
    CRIADOR_DEMANDA = "CRIADOR_DEMANDA"
    ENTREGADOR = "ENTREGADOR"


class UserCreate(SQLModel):
    nome: str | None = None
    email: str = Field(unique=True)
    password: str
    telefone: str


class User(UserCreate, table=True):
    id: UUID = Field(primary_key=True, default_factory=uuid4)
    is_admin: bool = Field(default=False)
    tipo_user: "UserTypes" = UserTypes.CRIADOR_DEMANDA

    criador_demanda: Optional["CriadorDemanda"] = Relationship(back_populates="user")
    entregador: Optional["CriadorDemanda"] = Relationship(back_populates="user")

    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime | None = Field(default=None)
    deleted_at: datetime | None = Field(default=None)


class CriadorDemanda(SQLModel, table=True):
    id: UUID = Field(primary_key=True, foreign_key="user.id")
    avaliacao_media: float = 0
    total_demandas: int = 0
    user: "User" = Relationship(back_populates="criador_demanda")


class Entregador(SQLModel, table=True):
    id: UUID = Field(primary_key=True, foreign_key="user.id")
    cnh: str
    tipo_veiculo: str
    placa_veiculo: str
    capacidade_kg: float
    avaliacao_media: float
    total_entregas: int
    user: "User" = Relationship(back_populates="entregador")
