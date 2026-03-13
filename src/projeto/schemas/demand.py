from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel  # pyright: ignore[reportUnknownVariableType]

"""

uuid        id              PK
        uuid        criador_id      FK
        varchar     titulo
        text        descricao
        varchar     endereco_origem
        decimal     lat_origem
        decimal     lon_origem
        varchar     endereco_destino
        decimal     lat_destino
        decimal     lon_destino
        decimal     valor_proposto
        decimal     peso_carga_kg
        varchar     status          "aberta | em_andamento | concluida | cancelada"
        timestamp   data_coleta
        timestamp   created_at
        timestamp   updated_at

"""


class DemandStatus(Enum):
    ABERTA = "aberta"
    EM_ANDAMENTO = "em_andamento"
    CONCLUIDA = "concluida"
    CANCELADA = "cancelada"


class DemandCreate(SQLModel):
    title: str
    description: str | None = None
    endereco_origem: str
    lat_origem: float
    lon_origem: float
    endereco_destino: str
    lat_destino: float
    lon_destino: float
    valor_proposto: float
    peso_carga_kg: float
    status: DemandStatus = DemandStatus.ABERTA
    data_coleta: datetime | None = None


class Demand(DemandCreate, table=True):
    user_id: UUID = Field(foreign_key="user.id")
    id: UUID = Field(primary_key=True, default_factory=uuid4)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime | None = Field(default=None)
    deleted_at: datetime | None = Field(default=None)
