from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Iterable

from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.tl.types import Message

from app.config import Settings
from app.repositories.events import EventsRepository
from app.schemas import EventIngestRequest

logger = logging.getLogger(__name__)


@dataclass
class TelegramIngestor:
    settings: Settings
    repo: EventsRepository

    def create_client(self) -> TelegramClient:
        session = (
            StringSession(self.settings.telegram_session_string)
            if self.settings.telegram_session_string
            else "tg_session"
        )
        return TelegramClient(
            session=session,
            api_id=self.settings.telegram_api_id,
            api_hash=self.settings.telegram_api_hash,
        )

    async def fetch_recent(self, limit: int = 20) -> None:
        client = self.create_client()
        if self.settings.telegram_login_mode == "bot":
            if not self.settings.telegram_bot_token:
                raise ValueError("TELEGRAM_BOT_TOKEN is required in bot login mode")
            await client.start(bot_token=self.settings.telegram_bot_token)
        else:
            if not self.settings.telegram_session_string:
                raise ValueError("TELEGRAM_SESSION_STRING is required in user login mode")
            await client.start()
        async with client:
            for channel in self.settings.telegram_channel_ids:
                async for message in client.iter_messages(entity=channel, limit=limit):
                    if not isinstance(message, Message):
                        continue
                    await self._ingest_message(channel, message)

    async def _ingest_message(self, channel: str, message: Message) -> None:
        if not message.message:
            return
        payload = EventIngestRequest(
            channel=channel,
            message_id=message.id,
            text=message.message,
            media_urls=[],
            published_at=message.date,
        )
        card = await self.repo.upsert(payload)
        logger.info("Ingested %s %s", channel, card.id)

