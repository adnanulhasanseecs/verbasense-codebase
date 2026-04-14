"""Mock ASR provider for deterministic transcript extraction."""

from __future__ import annotations

from uuid import UUID

from app.schemas.domain_config import DomainConfigPayload
from app.schemas.output import TranscriptSegment
from app.schemas.upload import UploadMetadata


class MockAsrProvider:
    def transcribe(
        self,
        *,
        job_id: UUID,
        audio_bytes: bytes,
        metadata: UploadMetadata,
        domain_cfg: DomainConfigPayload,
    ) -> list[TranscriptSegment]:
        _ = (audio_bytes, domain_cfg)
        case_ref = metadata.case_id or f"CASE-{str(job_id)[:8]}"
        room = metadata.courtroom or "Courtroom A"
        return [
            TranscriptSegment(
                speaker="Judge",
                text=f"Proceedings opened for {case_ref} in {room}.",
                start_ms=0,
                end_ms=6000,
            ),
            TranscriptSegment(
                speaker="Counsel",
                text="Initial submissions were recorded for review.",
                start_ms=6200,
                end_ms=12000,
            ),
        ]
