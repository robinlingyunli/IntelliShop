from fastapi import FastAPI
from sqlalchemy import text

from database import engine

app = FastAPI(title="IntelliShop API")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/db-health")
async def db_health():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT 1"))
        return {"status": "ok", "result": result.scalar()}
