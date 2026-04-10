"""Job status models."""

from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field


class JobStatus(StrEnum):
    queued = "queued"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class JobError(BaseModel):
    code: str
    message: str


class JobResponse(BaseModel):
    id: UUID
    status: JobStatus
    stage: str = ""
    progress: int = Field(0, ge=0, le=100)
    domain: str
    error: JobError | None = None
