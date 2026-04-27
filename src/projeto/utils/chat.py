from uuid import UUID

import jwt
from schemas.candidatura import Candidatura
from schemas.chat import Chat
from schemas.demand import Demand
from schemas.user import User
from settings import SETTINGS
from sqlmodel import col, or_, select
from sqlmodel.ext.asyncio.session import AsyncSession


async def autenticar_websocket(token: str, session: AsyncSession) -> User | None:
    """Autentica o usuário via JWT token (para uso em WebSocket)."""
    try:
        payload = jwt.decode(  # type: ignore[attr-defined]
            token,
            SETTINGS.SECRET_KEY,  # type: ignore[arg-type]
            algorithms=[SETTINGS.ALGORITHM],  # type: ignore[arg-type]
        )
        email: str | None = payload.get("sub")
        if email is None:
            return None
    except jwt.InvalidTokenError:
        return None

    return (await session.exec(select(User).where(User.email == email))).first()


async def verificar_acesso_chat(
    chat_id: UUID, user: User, session: AsyncSession
) -> Chat | None:
    """Retorna o Chat se o usuário tem acesso, None caso contrário."""
    result = (
        await session.exec(
            select(Chat, Candidatura, Demand)
            .where(
                col(Chat.id) == chat_id,
                or_(
                    Demand.user_id == user.id,
                    Candidatura.entregador_id == user.id,
                ),
            )
            .join(Candidatura, col(Chat.candidatura_id) == Candidatura.id)
            .join(Demand, col(Candidatura.demanda_id) == Demand.id)
        )
    ).first()
    return result[0] if result else None
