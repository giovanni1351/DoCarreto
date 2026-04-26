from datetime import datetime
from uuid import UUID

from sqlmodel import Field, SQLModel


class Chat(SQLModel):
    id: UUID = Field(primary_key=True)
    candidatura_id: UUID = Field(foreign_key="candidatura.id")
    created_at: datetime = Field(default_factory=datetime.now)
