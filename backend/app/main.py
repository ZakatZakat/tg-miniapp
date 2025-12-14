from __future__ import annotations

import logging

from fastapi import FastAPI

from app.config import Settings
from app.repositories.events import InMemoryEventsRepository
from app.routers import events, health

logging.basicConfig(level=logging.INFO)

settings = Settings()
app = FastAPI(title="tg-miniapp-backend")

events_repo = InMemoryEventsRepository()


@app.on_event("startup")
async def startup_event() -> None:
    app.state.events_repo = events_repo


app.include_router(health.router)
app.include_router(events.router)

