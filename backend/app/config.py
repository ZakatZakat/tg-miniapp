from __future__ import annotations

from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    telegram_api_id: int = Field(..., alias="TELEGRAM_API_ID")
    telegram_api_hash: str = Field(..., alias="TELEGRAM_API_HASH")
    telegram_bot_token: str | None = Field(default=None, alias="TELEGRAM_BOT_TOKEN")
    telegram_login_mode: str = Field("bot", alias="TELEGRAM_LOGIN_MODE")  # bot | user
    telegram_session_string: str | None = Field(default=None, alias="TELEGRAM_SESSION_STRING")
    telegram_channel_ids_raw: str = Field(..., alias="TELEGRAM_CHANNEL_IDS")

    redis_url: str = Field(..., alias="REDIS_URL")
    postgres_dsn: str | None = Field(default=None, alias="POSTGRES_DSN")

    bot_polling_interval: int = Field(2, alias="BOT_POLLING_INTERVAL")
    app_host: str = Field("0.0.0.0", alias="APP_HOST")
    app_port: int = Field(8000, alias="APP_PORT")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="allow")

    @property
    def telegram_channel_ids(self) -> list[str]:
        return [item.strip() for item in self.telegram_channel_ids_raw.split(",") if item.strip()]

