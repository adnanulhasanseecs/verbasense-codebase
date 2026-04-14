"""ASR provider protocol."""

from __future__ import annotations

from typing import Protocol
from uuid import UUID

from app.schemas.domain_config import DomainConfigPayload
from app.schemas.output import TranscriptSegment
from app.schemas.upload import UploadMetadata


class AsrProvider(Protocol):
    def transcribe(
        self,
        *,
        job_id: UUID,
        audio_bytes: bytes,
        metadata: UploadMetadata,
        domain_cfg: DomainConfigPayload,
    ) -> list[TranscriptSegment]: ...
