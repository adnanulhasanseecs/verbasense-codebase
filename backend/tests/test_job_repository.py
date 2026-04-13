"""Repository tests for durable job persistence and event history."""

from __future__ import annotations

import uuid
from pathlib import Path

from app.config.settings import get_settings
from app.db.repository import JobRepository
from app.db.session import dispose_engine, init_db
from app.schemas.job import JobStatus
from app.schemas.upload import UploadMetadata


def test_repository_create_and_get_job(monkeypatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "sqlite:///./.repo-test.db")
    db_file = Path(".repo-test.db")
    if db_file.exists():
        db_file.unlink()
    get_settings.cache_clear()
    dispose_engine()
    settings = get_settings()
    init_db(settings)

    repo = JobRepository(settings)
    job_id = uuid.uuid4()
    created = repo.create(
        job_id=job_id,
        domain="courtsense",
        metadata=UploadMetadata(case_id="C-1"),
        max_retries=2,
    )

    fetched = repo.get(job_id)
    assert fetched is not None
    assert fetched.job_id == created.job_id
    assert fetched.domain == "courtsense"
    assert fetched.metadata.case_id == "C-1"
    assert fetched.status == JobStatus.queued

    events = repo.list_events(job_id)
    assert events
    assert events[0].event_type == "job_created"

    repo.clear_all_for_tests()
    dispose_engine()


def test_repository_update_records_event(monkeypatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "sqlite:///./.repo-test.db")
    db_file = Path(".repo-test.db")
    if db_file.exists():
        db_file.unlink()
    get_settings.cache_clear()
    dispose_engine()
    settings = get_settings()
    init_db(settings)

    repo = JobRepository(settings)
    job_id = uuid.uuid4()
    repo.create(job_id=job_id, domain="courtsense", metadata=UploadMetadata(), max_retries=2)
    repo.update(job_id, status=JobStatus.processing, stage="transcription", progress=25)

    events = repo.list_events(job_id)
    assert len(events) >= 2
    assert events[-1].event_type == "job_updated"
    assert events[-1].payload["status"] == JobStatus.processing.value
    assert events[-1].payload["stage"] == "transcription"
    assert events[-1].payload["progress"] == 25

    repo.clear_all_for_tests()
    dispose_engine()
