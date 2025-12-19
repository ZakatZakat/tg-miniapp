from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query, Request

from app.config import Settings
from app.ingest.telegram import TelegramIngestor
from app.repositories.events import EventsRepository
from app.schemas import ClientErrorReport

router = APIRouter(prefix="/debug", tags=["debug"])
logger = logging.getLogger(__name__)


@router.get("/telegram-creds")
def telegram_creds() -> dict[str, object]:
    settings = Settings()

    def mask_secret(value: str | None, keep: int = 4) -> str | None:
        if not value:
            return None
        if len(value) <= keep:
            return "*" * len(value)
        return f"{'*' * (len(value) - keep)}{value[-keep:]}"

    return {
        "login_mode": settings.telegram_login_mode,
        "channel_ids": settings.telegram_channel_ids or [],
        "api_id": settings.telegram_api_id,
        "api_hash_masked": mask_secret(settings.telegram_api_hash),
        "bot_token_masked": mask_secret(settings.telegram_bot_token),
    }


@router.post("/client-error")
def client_error(payload: ClientErrorReport) -> dict[str, str]:
    logger.error(
        "client_error tag=%s message=%s url=%s ua=%s stack=%s",
        payload.tag,
        payload.message,
        payload.url,
        payload.user_agent,
        (payload.stack or "")[:2000],
    )
    return {"status": "ok"}


def _get_events_repo(request: Request) -> EventsRepository:
    return request.app.state.events_repo  # type: ignore[attr-defined]


@router.post("/telegram-fetch-recent")
async def telegram_fetch_recent(
    request: Request,
    limit: int = Query(20, ge=1, le=200),
    login_mode: str | None = Query(default=None, description="Override: bot | user"),
) -> dict[str, object]:
    settings = Settings()
    if login_mode in {"bot", "user"}:
        settings.telegram_login_mode = login_mode
    repo = _get_events_repo(request)
    ingestor = TelegramIngestor(settings=settings, repo=repo)
    try:
        await ingestor.fetch_recent(limit=limit)
    except Exception as e:
        logger.exception("telegram_fetch_recent failed")
        raise HTTPException(status_code=500, detail=str(e)) from e
    return {"status": "ok", "limit": limit, "channels": settings.telegram_channel_ids}



