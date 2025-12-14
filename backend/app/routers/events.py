from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request

from app.repositories.events import InMemoryEventsRepository
from app.schemas import EventCard, EventIngestRequest

router = APIRouter(prefix="/events", tags=["events"])


def get_repo(request: Request) -> InMemoryEventsRepository:
    return request.app.state.events_repo  # type: ignore[attr-defined]


@router.get("", response_model=list[EventCard])
def list_events(repo: InMemoryEventsRepository = Depends(get_repo), limit: int = Query(50, ge=1, le=200)) -> list[EventCard]:
    return repo.list_recent(limit=limit)


@router.post("/ingest", response_model=EventCard)
def ingest_event(payload: EventIngestRequest, repo: InMemoryEventsRepository = Depends(get_repo)) -> EventCard:
    return repo.upsert(payload)

