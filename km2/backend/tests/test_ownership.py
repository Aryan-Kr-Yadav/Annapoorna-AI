"""
Verifies the ownership-check helpers refuse to return rows that belong
to a different user — the single control point every router and every
AI tool function relies on (see app/services/ownership.py).

Uses a minimal fake Session rather than a live Postgres database (several
model columns use Postgres-only types like UUID/JSONB/pgvector, which
don't compile against SQLite) — sufficient here since we're only
verifying the 404-on-not-found control flow, not real query semantics.
"""
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.services.ownership import get_owned_crop_cycle, get_owned_farm


class FakeSession:
    """Always reports 'not found', to exercise the 404 branch."""

    def query(self, *entities, **kwargs):
        return self

    def filter(self, *conditions, **kwargs):
        return self

    def join(self, *args, **kwargs):
        return self

    def first(self):
        return None


def test_get_owned_farm_raises_404_when_not_found_or_not_owned():
    session = FakeSession()
    with pytest.raises(HTTPException) as exc_info:
        get_owned_farm(session, uuid4(), uuid4())
    assert exc_info.value.status_code == 404


def test_get_owned_crop_cycle_raises_404_when_not_found_or_not_owned():
    session = FakeSession()
    with pytest.raises(HTTPException) as exc_info:
        get_owned_crop_cycle(session, uuid4(), uuid4())
    assert exc_info.value.status_code == 404
