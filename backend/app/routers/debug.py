from __future__ import annotations

import logging

from fastapi import APIRouter

from app.config import Settings
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



