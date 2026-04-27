from schemas.candidatura import Candidatura
from schemas.chat import Chat
from schemas.criador_demanda import CriadorDemanda, CriadorDemandaPublic
from schemas.demand import Demand
from schemas.entregador import Entregador, EntregadorPublic
from schemas.mensagens import Mensagem
from schemas.user import User, UserCreate, UserPublic

__all__ = [
    "Candidatura",
    "Chat",
    "CriadorDemanda",
    "Demand",
    "Entregador",
    "Mensagem",
    "User",
    "UserCreate",
]

CriadorDemandaPublic.model_rebuild()
EntregadorPublic.model_rebuild()

UserPublic.model_rebuild()
