"""Durable job registry and async mock processing."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from time import monotonic
from uuid import UUID, uuid4

from app.api.exceptions import AppError
from app.asr.runtime import transcribe_for_job
from app.config.settings import Settings, get_settings
from app.core.pipeline import should_fail_job
from app.db.repository import JobRepository, PersistedJob
from app.db.session import dispose_engine, init_db
from app.providers import get_output_provider
from app.schemas.domain_config import DomainConfigPayload
from app.schemas.job import JobError, JobResponse, JobStatus
from app.schemas.output import OutputSchema
from app.schemas.upload import UploadMetadata
from app.services.account_ai import load_account_ai_overlay
from app.services.audio_artifacts import save_audio_artifact

logger = logging.getLogger(__name__)


@dataclass
class JobRecord:
    job_id: UUID
    domain: str
    metadata: UploadMetadata
    status: JobStatus = JobStatus.queued
    stage: str = ""
    progress: int = 0
    error: JobError | None = None
    output: OutputSchema | None = None


@dataclass
class QueueItem:
    job_id: UUID
    domain_cfg: DomainConfigPayload
    account_id: str | None
    force_failure: bool
    attempt: int


class JobService:
    """Stores jobs durably and runs the mock pipeline in asyncio tasks."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._repo = JobRepository(settings)
        self._provider = get_output_provider(settings)
        init_db(settings)
        self._queue: asyncio.Queue[QueueItem] = asyncio.Queue()
        self._worker_tasks: list[asyncio.Task[None]] = []
        self._workers_started = False
        self._last_retention_run = 0.0
        self._audio_inputs: dict[UUID, bytes] = {}

    async def create_job(
        self,
        domain_cfg: DomainConfigPayload,
        metadata: UploadMetadata,
        audio_bytes: bytes,
        force_failure: bool,
        account_id: str | None = None,
        idempotency_key: str | None = None,
        content_type: str = "application/octet-stream",
        filename: str | None = None,
    ) -> JobRecord:
        await self._ensure_workers()
        await self._maybe_run_retention()
        if idempotency_key:
            existing = self._repo.get_by_idempotency_key(idempotency_key)
            if existing is not None:
                logger.info(
                    "job.idempotent_reuse",
                    extra={"job_id": str(existing.job_id), "idempotency_key": idempotency_key},
                )
                return _to_record(existing)
        job_id = uuid4()
        persisted = self._repo.create(
            job_id=job_id,
            domain=domain_cfg.id,
            metadata=metadata,
            max_retries=self._settings.job_max_retries,
            account_id=account_id,
            idempotency_key=idempotency_key,
        )
        self._audio_inputs[job_id] = audio_bytes
        save_audio_artifact(
            settings=self._settings,
            audio_bytes=audio_bytes,
            source_type="upload",
            account_id=account_id,
            job_id=job_id,
            mime_type=content_type,
            original_filename=filename,
        )
        await self._queue.put(
            QueueItem(
                job_id=job_id,
                domain_cfg=domain_cfg,
                account_id=account_id,
                force_failure=force_failure,
                attempt=0,
            )
        )
        logger.info("job.created", extra={"job_id": str(job_id), "domain": domain_cfg.id})
        return _to_record(persisted)

    async def get_job(self, job_id: UUID) -> JobRecord | None:
        persisted = self._repo.get(job_id)
        if persisted is None:
            return None
        return _to_record(persisted)

    async def _run_pipeline(
        self,
        job_id: UUID,
        domain_cfg: DomainConfigPayload,
        force_failure: bool,
        account_id: str | None,
    ) -> None:
        delay_ms = max(0, self._settings.mock_delay_ms)
        stages = domain_cfg.pipeline.stages or ["processing"]
        current = self._repo.get(job_id)
        if current is None:
            return

        self._repo.update(
            job_id,
            status=JobStatus.processing,
            stage=stages[0],
            progress=0,
            error=None,
        )

        if should_fail_job(job_id, self._settings.mock_failure_rate, force_failure):
            await self._fail_after_stages(job_id, stages, delay_ms)
            return

        n = len(stages)
        for i, st in enumerate(stages):
            self._repo.update(
                job_id,
                status=JobStatus.processing,
                stage=st,
                progress=int((i / max(n, 1)) * 100),
                error=None,
            )
            await asyncio.sleep(delay_ms / 1000.0)

        audio_bytes = self._audio_inputs.get(job_id, b"")
        overlay = load_account_ai_overlay(self._settings, account_id)
        transcript = transcribe_for_job(
            settings=self._settings,
            overlay=overlay,
            job_id=job_id,
            audio_bytes=audio_bytes,
            metadata=current.metadata,
            domain_cfg=domain_cfg,
        )
        result = self._provider.generate_output(
            job_id=job_id,
            domain_cfg=domain_cfg,
            metadata=current.metadata,
            flow="transcription_intelligence",
            transcript=transcript,
            account_overlay=overlay,
        )
        output_payload = dict(result.output)
        output_payload["transcript"] = [segment.model_dump(mode="json") for segment in transcript]
        self._repo.update(
            job_id,
            status=JobStatus.completed,
            stage=stages[-1],
            progress=100,
            output=OutputSchema.model_validate(output_payload),
            error=None,
            telemetry={
                "provider": result.provider,
                "model": result.model,
                "latency_ms": result.latency_ms,
                "token_usage_estimate": result.token_usage_estimate,
            },
        )
        logger.info("job.completed", extra={"job_id": str(job_id)})

    async def _ensure_workers(self) -> None:
        if self._workers_started:
            return
        for idx in range(self._settings.job_worker_concurrency):
            self._worker_tasks.append(asyncio.create_task(self._worker_loop(idx)))
        self._workers_started = True

    async def _worker_loop(self, worker_id: int) -> None:
        while True:
            item = await self._queue.get()
            try:
                await self._run_pipeline(
                    item.job_id,
                    item.domain_cfg,
                    item.force_failure,
                    item.account_id,
                )
            except AppError as err:
                logger.warning(
                    "job.failed_client_error",
                    extra={
                        "job_id": str(item.job_id),
                        "code": err.code,
                        "message": err.message,
                    },
                )
                self._repo.update(
                    item.job_id,
                    status=JobStatus.failed,
                    error=JobError(code=err.code, message=err.message),
                )
            except Exception as e:  # noqa: BLE001
                logger.exception(
                    "job.worker_exception",
                    extra={
                        "job_id": str(item.job_id),
                        "worker_id": worker_id,
                        "attempt": item.attempt,
                    },
                )
                if item.attempt < self._settings.job_max_retries:
                    await asyncio.sleep(min(2**item.attempt, 5))
                    self._repo.update(
                        item.job_id,
                        retry_count=item.attempt + 1,
                        error=JobError(code="retrying", message=str(e)),
                    )
                    await self._queue.put(
                        QueueItem(
                            job_id=item.job_id,
                            domain_cfg=item.domain_cfg,
                            account_id=item.account_id,
                            force_failure=item.force_failure,
                            attempt=item.attempt + 1,
                        )
                    )
                else:
                    self._repo.update(
                        item.job_id,
                        status=JobStatus.failed,
                        retry_count=item.attempt,
                        error=JobError(
                            code="processing_retries_exhausted",
                            message=f"Retries exhausted after {item.attempt} attempts",
                        ),
                    )
            finally:
                record = self._repo.get(item.job_id)
                if record is not None and record.status in (JobStatus.completed, JobStatus.failed):
                    self._audio_inputs.pop(item.job_id, None)
                self._queue.task_done()

    async def _maybe_run_retention(self) -> None:
        now = monotonic()
        if (now - self._last_retention_run) < self._settings.retention_check_interval_seconds:
            return
        deleted = self._repo.purge_terminal_before(
            older_than_days=self._settings.job_retention_days
        )
        if deleted > 0:
            logger.info("jobs.retention_cleanup", extra={"deleted": deleted})
        self._last_retention_run = now

    async def _fail_after_stages(
        self,
        job_id: UUID,
        stages: list[str],
        delay_ms: int,
    ) -> None:
        n = max(len(stages), 1)
        for i, st in enumerate(stages):
            self._repo.update(
                job_id,
                status=JobStatus.processing,
                stage=st,
                progress=int((i / n) * 80),
                error=None,
            )
            await asyncio.sleep(delay_ms / 1000.0)

        self._repo.update(
            job_id,
            status=JobStatus.failed,
            progress=100,
            stage=stages[-1] if stages else "failed",
            error=JobError(
                code="mock_pipeline_failed",
                message="Simulated pipeline failure (MOCK_FAILURE_RATE or X-Mock-Failure).",
            ),
        )
        logger.info("job.failed_mock", extra={"job_id": str(job_id)})


def _to_record(p: PersistedJob) -> JobRecord:
    return JobRecord(
        job_id=p.job_id,
        domain=p.domain,
        metadata=p.metadata,
        status=p.status,
        stage=p.stage,
        progress=p.progress,
        error=p.error,
        output=p.output,
    )


def job_to_response(r: JobRecord) -> JobResponse:
    err = None
    if r.status == JobStatus.failed and r.error:
        err = r.error
    return JobResponse(
        id=r.job_id,
        status=r.status,
        stage=r.stage,
        progress=r.progress,
        domain=r.domain,
        error=err,
    )


_job_service: JobService | None = None


def get_job_service() -> JobService:
    global _job_service
    if _job_service is None:
        _job_service = JobService(get_settings())
    return _job_service


def reset_job_service_for_tests() -> None:
    """Clear singleton and durable test records."""
    global _job_service
    if _job_service is not None:
        for task in _job_service._worker_tasks:
            task.cancel()
        _job_service._repo.clear_all_for_tests()
    _job_service = None
    dispose_engine()
