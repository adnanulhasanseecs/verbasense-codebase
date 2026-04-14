"""Test provider that returns malformed output payload."""

from __future__ import annotations

from uuid import UUID

from app.providers.types import ProviderConfig, RawProviderResult
from app.schemas.domain_config import DomainConfigPayload
from app.schemas.output import TranscriptSegment
from app.schemas.upload import UploadMetadata


class InvalidOutputProvider:
    def generate_output(
        self,
        *,
        job_id: UUID,
        domain_cfg: DomainConfigPayload,
        metadata: UploadMetadata,
        config: ProviderConfig,
        transcript: list[TranscriptSegment] | None = None,
    ) -> RawProviderResult:
        _ = (job_id, domain_cfg, metadata, config, transcript)
        return RawProviderResult(payload={"unexpected": True}, token_usage_estimate=1)
