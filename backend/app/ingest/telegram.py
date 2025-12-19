from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
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
    media_root: Path = Path(__file__).resolve().parents[2] / "media"

    def create_client(self) -> TelegramClient:
        session: StringSession | str = "tg_session"
        if self.settings.telegram_login_mode != "bot" and self.settings.telegram_session_string:
            session = StringSession(self.settings.telegram_session_string)
        return TelegramClient(
            session=session,
            api_id=self.settings.telegram_api_id,
            api_hash=self.settings.telegram_api_hash,
        )

    async def fetch_recent(self, limit: int = 20) -> None:
        self.media_root.mkdir(parents=True, exist_ok=True)
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
                    await self._ingest_message(client, channel, message)

    async def _ingest_message(self, client: TelegramClient, channel: str, message: Message) -> None:
        if not message.message:
            return
        media_urls = await self._collect_media(client, message)
        published_at = (
            message.date.replace(tzinfo=None) if getattr(message.date, "tzinfo", None) else message.date
        )
        payload = EventIngestRequest(
            channel=channel,
            message_id=message.id,
            text=message.message,
            media_urls=media_urls,
            published_at=published_at,
        )
        card = await self.repo.upsert(payload)
        logger.info("Ingested %s %s", channel, card.id)

    async def _collect_media(self, client: TelegramClient, message: Message) -> list[str]:
        if not message.media:
            return []
        urls: list[str] = []
        suffix = ""
        try:
            fname = getattr(message.file, "name", None) if hasattr(message, "file") else None
            if fname:
                suffix = Path(fname).suffix
        except Exception:
            suffix = ""
        if not suffix:
            suffix = ".jpg"
        filename = f"{message.peer_id.channel_id if getattr(message.peer_id, 'channel_id', None) else 'ch'}_{message.id}{suffix}"
        dest = self.media_root / filename
        path = await client.download_media(message, file=str(dest))
        if path:
            urls.append(f"/media/{Path(path).name}")
        return urls

