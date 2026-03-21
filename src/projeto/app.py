from typing import Any, Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # ← ADICIONE ESTA LINHA
from fastapi.openapi.utils import get_openapi
from routes import candidatura, criador_demanda, demand, entregador, token, user
from uvicorn import run

app = FastAPI()

# ← ADICIONE ISTO (antes de incluir as rotas)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite tudo (desenvolvimento)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(token.router)
app.include_router(demand.router)
app.include_router(entregador.router)
app.include_router(criador_demanda.router)
app.include_router(candidatura.router)


def custom_openapi() -> dict[str, Any]:
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema: dict[str, Any] = get_openapi(
        title="Exata API Example",
        version="0.2.132",
        summary="Sistema exemplo Exata de api em FastApi ",
        description="O acesso desta api é restrito para usuarios da exata",
        routes=app.routes,
    )
    openapi_schema["info"]["x-logo"] = {
        "url": "https://exata.dev/storage/img/exata_BLACK_NO_IT.png"
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


@app.get("/heath")
async def health() -> dict[str, Literal["Ok"]]:
    return {"status": "Ok"}


if __name__ == "__main__":
    run("app:app", reload=True)
