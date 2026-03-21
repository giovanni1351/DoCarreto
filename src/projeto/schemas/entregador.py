from typing import TYPE_CHECKING
from uuid import UUID

from pydantic import BaseModel
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from projeto.schemas.user import User


class EntregadorCreate(SQLModel):
    cnh: str
    tipo_veiculo: str
    placa_veiculo: str
    capacidade_kg: float


class Entregador(EntregadorCreate, table=True):
    id: UUID = Field(primary_key=True, foreign_key="user.id")
    total_entregas: int = 0
    avaliacao_media: float = 0

    user: "User" = Relationship(back_populates="entregador")


class EntregadorPublic(BaseModel):
    cnh: str | None
    tipo_veiculo: str | None
    placa_veiculo: str | None
    capacidade_kg: float | None
    total_entregas: int = 0
    avaliacao_media: float = 0


EntregadorPublic.model_rebuild()
