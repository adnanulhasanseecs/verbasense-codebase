"""Persistence helpers for job state transitions."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from uuid import UUID

from app.config.settings import Settings
from app.db.models import JobEventModel, JobModel
from app.db.session import session_scope
from app.schemas.job import JobError, JobStatus
from app.schemas.output import OutputSchema
from app.schemas.upload import UploadMetadata


@dataclass
class PersistedJob:
    job_id: UUID
    account_id: str | None
    domain: str
    metadata: UploadMetadata
    status: JobStatus
    stage: str
    progress: int
    retry_count: int
    max_retries: int
    idempotency_key: str | None
    error: JobError | None
    output: OutputSchema | None


@dataclass
class JobEvent:
    event_type: str
    payload: dict[str, object]


class JobRepository:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def create(
        self,
        job_id: UUID,
        domain: str,
        metadata: UploadMetadata,
        *,
        max_retries: int,
        account_id: str | None = None,
        idempotency_key: str | None = None,
    ) -> PersistedJob:
        model = JobModel(
            id=str(job_id),
            account_id=account_id,
            domain=domain,
            status=JobStatus.queued.value,
            stage="",
            progress=0,
            retry_count=0,
            max_retries=max_retries,
            idempotency_key=idempotency_key,
            upload_metadata=metadata.model_dump(mode="json"),
            output_payload=None,
        )
        with session_scope(self._settings) as session:
            session.add(model)
            session.add(
                JobEventModel(
                    job_id=str(job_id),
                    event_type="job_created",
                    payload={"domain": domain, "account_id": account_id},
                )
            )
            session.commit()
        persisted = self.get(job_id)
        if persisted is None:
            msg = "Persisted job not found immediately after insert"
            raise RuntimeError(msg)
        return persisted

    def get(self, job_id: UUID) -> PersistedJob | None:
        with session_scope(self._settings) as session:
            model = session.get(JobModel, str(job_id))
            if model is None:
                return None
            return _to_persisted(model)

    def get_by_idempotency_key(self, idempotency_key: str) -> PersistedJob | None:
        with session_scope(self._settings) as session:
            model = (
                session.query(JobModel)
                .filter(JobModel.idempotency_key == idempotency_key)
                .one_or_none()
            )
            if model is None:
                return None
            return _to_persisted(model)

    def update(
        self,
        job_id: UUID,
        *,
        status: JobStatus | None = None,
        stage: str | None = None,
        progress: int | None = None,
        retry_count: int | None = None,
        error: JobError | None = None,
        output: OutputSchema | None = None,
        telemetry: dict[str, object] | None = None,
    ) -> PersistedJob | None:
        with session_scope(self._settings) as session:
            model = session.get(JobModel, str(job_id))
            if model is None:
                return None
            if status is not None:
                model.status = status.value
            if stage is not None:
                model.stage = stage
            if progress is not None:
                model.progress = progress
            if retry_count is not None:
                model.retry_count = retry_count
            if error is not None:
                model.error_code = error.code
                model.error_message = error.message
            if error is None and status in (
                JobStatus.completed,
                JobStatus.processing,
                JobStatus.queued,
            ):
                model.error_code = None
                model.error_message = None
            if output is not None:
                model.output_payload = output.model_dump(mode="json")

            payload: dict[str, object] = {
                "status": model.status,
                "stage": model.stage,
                "progress": model.progress,
                "retry_count": model.retry_count,
                "max_retries": model.max_retries,
            }
            if model.error_code and model.error_message:
                payload["error"] = {"code": model.error_code, "message": model.error_message}
            if telemetry is not None:
                payload["telemetry"] = telemetry
            session.add(
                JobEventModel(
                    job_id=str(job_id),
                    event_type="job_updated",
                    payload=payload,
                )
            )
            session.add(model)
            session.commit()
            session.refresh(model)
            return _to_persisted(model)

    def clear_all_for_tests(self) -> None:
        with session_scope(self._settings) as session:
            session.query(JobEventModel).delete()
            session.query(JobModel).delete()
            session.commit()

    def list_events(self, job_id: UUID) -> list[JobEvent]:
        with session_scope(self._settings) as session:
            rows = (
                session.query(JobEventModel)
                .filter(JobEventModel.job_id == str(job_id))
                .order_by(JobEventModel.id.asc())
                .all()
            )
            return [JobEvent(event_type=row.event_type, payload=row.payload or {}) for row in rows]

    def purge_terminal_before(self, *, older_than_days: int) -> int:
        cutoff = datetime.now(tz=UTC) - timedelta(days=older_than_days)
        with session_scope(self._settings) as session:
            deleted = (
                session.query(JobModel)
                .filter(JobModel.status.in_([JobStatus.completed.value, JobStatus.failed.value]))
                .filter(JobModel.updated_at < cutoff)
                .delete(synchronize_session=False)
            )
            session.commit()
            return int(deleted)


def _to_persisted(model: JobModel) -> PersistedJob:
    parsed_error: JobError | None = None
    if model.error_code and model.error_message:
        parsed_error = JobError(code=model.error_code, message=model.error_message)

    parsed_output: OutputSchema | None = None
    if model.output_payload is not None:
        parsed_output = OutputSchema.model_validate(model.output_payload)

    return PersistedJob(
        job_id=UUID(model.id),
        account_id=model.account_id,
        domain=model.domain,
        metadata=UploadMetadata.model_validate(model.upload_metadata or {}),
        status=JobStatus(model.status),
        stage=model.stage,
        progress=model.progress,
        retry_count=model.retry_count,
        max_retries=model.max_retries,
        idempotency_key=model.idempotency_key,
        error=parsed_error,
        output=parsed_output,
    )
