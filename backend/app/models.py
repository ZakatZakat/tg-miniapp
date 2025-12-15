from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import DateTime, String, Text, UniqueConstraint, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Event(Base):
    __tablename__ = "events"
    __table_args__ = (UniqueConstraint("channel", "message_id", name="uq_channel_message"),)

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: uuid4().hex)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    channel: Mapped[str] = mapped_column(String(128), index=True)
    message_id: Mapped[int] = mapped_column(index=True)
    event_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=False), nullable=True)
    media_urls: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    price: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    source_link: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow)

