from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from typing import Iterable

from telethon import TelegramClient
from telethon.tl.types import Message

from app.config import Settings
from app.repositories.events import InMemoryEventsRepository
from app.schemas import EventIngestRequest

logger = logging.getLogger(__name__)


@dataclass
class TelegramIngestor:
    settings: Settings
    repo: InMemoryEventsRepository

    def create_client(self) -> TelegramClient:
        return TelegramClient(
            session="tg_session",
            api_id=self.settings.telegram_api_id,
            api_hash=self.settings.telegram_api_hash,
        )

    async def fetch_recent(self, limit: int = 20) -> None:
        client = self.create_client()
        await client.start()
        async with client:
            for channel in self.settings.telegram_channel_ids:
                async for message in client.iter_messages(entity=channel, limit=limit):
                    if not isinstance(message, Message):
                        continue
                    self._ingest_message(channel, message)

    def _ingest_message(self, channel: str, message: Message) -> None:
        if not message.message:
            return
        payload = EventIngestRequest(
            channel=channel,
            message_id=message.id,
            text=message.message,
            media_urls=[],
            published_at=message.date,
        )
        card = self.repo.upsert(payload)
        logger.info("Ingested %s %s", channel, card.id)

