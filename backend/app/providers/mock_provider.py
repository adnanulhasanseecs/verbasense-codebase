"""Default deterministic provider backed by existing mock pipeline."""

from __future__ import annotations

from uuid import UUID

from app.core.pipeline import build_mock_output
from app.providers.types import ProviderConfig, RawProviderResult
from app.schemas.domain_config import DomainConfigPayload
from app.schemas.output import TranscriptSegment
from app.schemas.upload import UploadMetadata


class MockOutputProvider:
    """Provider adapter that preserves existing deterministic behavior."""

    def generate_output(
        self,
        *,
        job_id: UUID,
        domain_cfg: DomainConfigPayload,
        metadata: UploadMetadata,
        config: ProviderConfig,
        transcript: list[TranscriptSegment] | None = None,
    ) -> RawProviderResult:
        _ = config
        generated = build_mock_output(
            job_id=job_id,
            domain_cfg=domain_cfg,
            metadata=metadata,
        )
        if transcript:
            generated.transcript = transcript
        payload = generated.model_dump(mode="json")
        summary = str(payload.get("summary", ""))
        transcript_len = len(payload.get("transcript", []))
        token_estimate = max(1, (len(summary) // 4) + (transcript_len * 24))
        return RawProviderResult(payload=payload, token_usage_estimate=token_estimate)
