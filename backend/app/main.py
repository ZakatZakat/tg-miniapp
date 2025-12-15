from __future__ import annotations

import logging
import asyncio
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import Settings
from app.db import create_engine, create_session_maker
from app.models import Base
from app.repositories.events import EventsRepository, InMemoryEventsRepository
from app.repositories.postgres import PostgresEventsRepository
from app.routers import events, health
from app.ingest.telegram import TelegramIngestor
from app.tasks.polling import TelegramPollingService
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

logging.basicConfig(level=logging.INFO)

settings = Settings()
app = FastAPI(title="tg-miniapp-backend")
MEDIA_ROOT = Path(__file__).resolve().parents[1] / "media"
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

events_repo: EventsRepository
engine: AsyncEngine | None = None
session_factory: async_sessionmaker[AsyncSession] | None = None
polling_service: TelegramPollingService | None = None
polling_task: asyncio.Task | None = None


@app.on_event("startup")
async def startup_event() -> None:
    global events_repo, engine, session_factory
    if settings.postgres_dsn:
        engine = create_engine(settings.postgres_dsn)
        session_factory = create_session_maker(engine)
        async with engine.begin() as conn:  # type: ignore[union-attr]
            await conn.run_sync(Base.metadata.create_all)
        events_repo = PostgresEventsRepository(session_factory)
    else:
        events_repo = InMemoryEventsRepository()
    app.state.events_repo = events_repo

    if settings.telegram_channel_ids and (settings.telegram_bot_token or settings.telegram_session_string):
        ingestor = TelegramIngestor(settings=settings, repo=events_repo)
        service = TelegramPollingService(ingestor=ingestor, interval_seconds=settings.bot_polling_interval)
        polling_service = service
        polling_task = asyncio.create_task(service.run())


@app.on_event("shutdown")
async def shutdown_event() -> None:
    if polling_service is not None:
        polling_service.stop()
    if polling_task is not None:
        await polling_task
    if engine is not None:
        await engine.dispose()  # type: ignore[union-attr]


app.include_router(health.router)
app.include_router(events.router)

app.mount("/media", StaticFiles(directory=MEDIA_ROOT, html=False), name="media")

