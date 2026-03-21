from typing import TYPE_CHECKING
from uuid import UUID

from pydantic import BaseModel
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from projeto.schemas.user import User


class CriadorDemanda(SQLModel, table=True):
    id: UUID = Field(primary_key=True, foreign_key="user.id")
    avaliacao_media: float = 0
    total_demandas: int = 0
    user: "User" = Relationship(back_populates="criador_demanda")


class CriadorDemandaPublic(BaseModel):
    avaliacao_media: float = 0
    total_demandas: int = 0
