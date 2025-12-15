from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, HttpUrl


class EventCard(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    channel: str
    message_id: int
    event_time: Optional[datetime] = None
    media_urls: list[str] = []
    location: Optional[str] = None
    price: Optional[str] = None
    category: Optional[str] = None
    source_link: Optional[HttpUrl] = None
    created_at: datetime


class EventIngestRequest(BaseModel):
    channel: str
    message_id: int
    text: str
    media_urls: list[str] = []
    published_at: Optional[datetime] = None

