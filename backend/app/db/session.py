"""Engine/session management for backend persistence."""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config.settings import Settings
from app.db.base import Base

_ENGINE: Engine | None = None
_SESSION_FACTORY: sessionmaker[Session] | None = None


def _engine(settings: Settings) -> Engine:
    global _ENGINE, _SESSION_FACTORY
    if _ENGINE is None:
        connect_args = (
            {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
        )
        _ENGINE = create_engine(settings.database_url, future=True, connect_args=connect_args)
        _SESSION_FACTORY = sessionmaker(bind=_ENGINE, autoflush=False, autocommit=False)
    return _ENGINE


def init_db(settings: Settings) -> None:
    # Ensure ORM models are registered on Base.metadata before create_all.
    from app.db import models  # noqa: F401

    engine = _engine(settings)
    Base.metadata.create_all(engine)


def dispose_engine() -> None:
    global _ENGINE, _SESSION_FACTORY
    if _ENGINE is not None:
        _ENGINE.dispose()
    _ENGINE = None
    _SESSION_FACTORY = None


@contextmanager
def session_scope(settings: Settings) -> Iterator[Session]:
    if _SESSION_FACTORY is None:
        _engine(settings)
    assert _SESSION_FACTORY is not None
    session = _SESSION_FACTORY()
    try:
        yield session
    finally:
        session.close()
