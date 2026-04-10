"""In-memory job registry and async mock processing."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from uuid import UUID, uuid4

from app.config.settings import Settings, get_settings
from app.core.pipeline import build_mock_output, should_fail_job
from app.schemas.domain_config import DomainConfigPayload
from app.schemas.job import JobError, JobResponse, JobStatus
from app.schemas.output import OutputSchema
from app.schemas.upload import UploadMetadata

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


class JobService:
    """Stores jobs and runs the mock pipeline in asyncio tasks."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._jobs: dict[UUID, JobRecord] = {}
        self._lock = asyncio.Lock()

    async def create_job(
        self,
        domain_cfg: DomainConfigPayload,
        metadata: UploadMetadata,
        force_failure: bool,
    ) -> JobRecord:
        job_id = uuid4()
        record = JobRecord(job_id=job_id, domain=domain_cfg.id, metadata=metadata)
        async with self._lock:
            self._jobs[job_id] = record
        asyncio.create_task(self._run_pipeline(record, domain_cfg, force_failure))
        logger.info("job.created", extra={"job_id": str(job_id), "domain": domain_cfg.id})
        return record

    async def get_job(self, job_id: UUID) -> JobRecord | None:
        async with self._lock:
            return self._jobs.get(job_id)

    async def _run_pipeline(
        self,
        record: JobRecord,
        domain_cfg: DomainConfigPayload,
        force_failure: bool,
    ) -> None:
        delay_ms = max(0, self._settings.mock_delay_ms)
        stages = domain_cfg.pipeline.stages
        if not stages:
            stages = ["processing"]

        try:
            record.status = JobStatus.processing
            if should_fail_job(record.job_id, self._settings.mock_failure_rate, force_failure):
                await self._fail_after_stages(record, stages, delay_ms)
                return

            n = len(stages)
            for i, st in enumerate(stages):
                record.stage = st
                record.progress = int((i / max(n, 1)) * 100)
                await asyncio.sleep(delay_ms / 1000.0)
            record.stage = stages[-1]
            record.progress = 100
            record.output = build_mock_output(record.job_id, domain_cfg, record.metadata)
            record.status = JobStatus.completed
            logger.info("job.completed", extra={"job_id": str(record.job_id)})
        except Exception as e:  # noqa: BLE001 — last-resort capture for mock service
            logger.exception("job.failed_unexpected")
            record.status = JobStatus.failed
            record.error = JobError(code="internal_error", message=str(e))

    async def _fail_after_stages(
        self,
        record: JobRecord,
        stages: list[str],
        delay_ms: int,
    ) -> None:
        n = max(len(stages), 1)
        for i, st in enumerate(stages):
            record.stage = st
            record.progress = int((i / n) * 80)
            await asyncio.sleep(delay_ms / 1000.0)
        record.status = JobStatus.failed
        record.progress = 100
        record.stage = stages[-1] if stages else "failed"
        record.error = JobError(
            code="mock_pipeline_failed",
            message="Simulated pipeline failure (MOCK_FAILURE_RATE or X-Mock-Failure).",
        )
        logger.info("job.failed_mock", extra={"job_id": str(record.job_id)})


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
    """Clear singleton (tests only)."""
    global _job_service
    _job_service = None
