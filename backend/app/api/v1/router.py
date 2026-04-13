"""Versioned HTTP routes."""

from __future__ import annotations

import logging
from typing import Annotated, Any, cast
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Header, UploadFile
from fastapi.encoders import jsonable_encoder

from app.api.deps import DomainStoreDep
from app.api.exceptions import BadRequestError, PayloadTooLargeError
from app.config.settings import Settings, get_settings
from app.schemas.job import JobResponse
from app.schemas.output import ResultEnvelope
from app.schemas.upload import UploadMetadata
from app.services.job_service import JobService, get_job_service, job_to_response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1")


async def _read_upload_with_limit(upload: UploadFile, max_bytes: int) -> bytes:
    total = 0
    chunks: list[bytes] = []
    while True:
        chunk = await upload.read(1024 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            raise PayloadTooLargeError(max_bytes)
        chunks.append(chunk)
    return b"".join(chunks)


ALLOWED_SUFFIXES = {".wav", ".mp3"}


@router.post("/upload", status_code=201)
async def upload_audio(
    file: Annotated[UploadFile, File(..., description="Audio file (.wav or .mp3)")],
    settings: Annotated[Settings, Depends(get_settings)],
    jobs: Annotated[JobService, Depends(get_job_service)],
    domains: DomainStoreDep,
    metadata: str | None = Form(default=None),
    domain: str = Form(default="courtsense"),
    x_mock_failure: Annotated[str | None, Header(alias="X-Mock-Failure")] = None,
    x_idempotency_key: Annotated[str | None, Header(alias="X-Idempotency-Key")] = None,
) -> JobResponse:
    """Accept multipart upload; optional JSON `metadata` and `domain` form fields."""
    filename = file.filename or "audio"
    suffix = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if suffix not in ALLOWED_SUFFIXES:
        raise BadRequestError(
            "invalid_file_type",
            "Only .wav and .mp3 files are accepted",
            {"filename": filename},
        )

    try:
        meta = UploadMetadata.parse_json(metadata)
    except ValueError as e:
        raise BadRequestError("invalid_metadata", str(e)) from e

    cfg = domains.get(domain)
    if cfg is None:
        raise BadRequestError("unknown_domain", f"Unknown domain: {domain}", {"domain": domain})

    _ = await _read_upload_with_limit(file, settings.max_upload_bytes)
    force_failure = (x_mock_failure or "").strip().lower() in ("1", "true", "yes")

    record = await jobs.create_job(
        cfg,
        meta,
        force_failure=force_failure,
        idempotency_key=x_idempotency_key,
    )
    return job_to_response(record)


@router.get("/job/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: UUID,
    jobs: Annotated[JobService, Depends(get_job_service)],
) -> JobResponse:
    record = await jobs.get_job(job_id)
    if record is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="job_not_found")
    return job_to_response(record)


@router.get("/result/{job_id}", response_model=ResultEnvelope)
async def get_result(
    job_id: UUID,
    jobs: Annotated[JobService, Depends(get_job_service)],
) -> ResultEnvelope:
    record = await jobs.get_job(job_id)
    if record is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="job_not_found")
    if record.status.value == "failed":
        from fastapi import HTTPException

        raise HTTPException(status_code=409, detail="job_failed")
    if record.output is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="result_not_ready")
    return ResultEnvelope(job_id=str(record.job_id), domain=record.domain, output=record.output)


@router.get("/config/domain/{domain_id}")
async def get_domain_config(
    domain_id: str,
    domains: DomainStoreDep,
) -> dict[str, Any]:
    cfg = domains.get(domain_id)
    if cfg is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="domain_not_found")
    return cast(dict[str, Any], jsonable_encoder(cfg.model_dump_public()))


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "verbasense-backend"}
