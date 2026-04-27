from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


if TYPE_CHECKING:
    from schemas.criador_demanda import CriadorDemanda
    from schemas.entregador import Entregador
"""
Mensagens {
    uuid        id          PK
    uuid        chat_id     FK
    uuid        remetente_id FK
    text        conteudo
    boolean     lida
    timestamp   created_at
}"""

class Mensagem(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4,primary_key=True)
    chat_id: UUID = Field(foreign_key="chat.id")
    remetente_id: UUID = Field(foreign_key="user.id")
    conteudo: str
    lida: bool = False
    created_at: datetime = Field(default_factory=datetime.now)

class MensagemPublic(SQLModel):
    id: UUID
    chat_id: UUID
    remetente_id: UUID
    conteudo: str
    lida: bool
    created_at: datetime

