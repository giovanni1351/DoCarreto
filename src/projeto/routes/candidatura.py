from database import AsyncSessionDep
from fastapi import APIRouter
from schemas.candidatura import Candidatura, CandidaturaCreate

router = APIRouter(prefix="/candidatura", tags=["Demand"])


@router.post("/")
async def criar_cadidatura(
    candidatura: CandidaturaCreate, session: AsyncSessionDep
) -> Candidatura:
    candidatura = Candidatura()
