from __future__ import annotations

from fastapi import APIRouter

from app.config import Settings

router = APIRouter(prefix="/debug", tags=["debug"])


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

