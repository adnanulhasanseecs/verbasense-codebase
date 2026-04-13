"""Test-oriented provider that always raises to exercise fallback paths."""

from __future__ import annotations

from uuid import UUID

from app.providers.types import ProviderConfig, RawProviderResult
from app.schemas.domain_config import DomainConfigPayload
from app.schemas.upload import UploadMetadata


class FailingOutputProvider:
    def generate_output(
        self,
        *,
        job_id: UUID,
        domain_cfg: DomainConfigPayload,
        metadata: UploadMetadata,
        config: ProviderConfig,
    ) -> RawProviderResult:
        _ = (job_id, domain_cfg, metadata, config)
        msg = "Simulated provider failure"
        raise RuntimeError(msg)
