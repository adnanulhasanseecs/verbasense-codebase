"""Provider protocols and config for structured output generation."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol
from uuid import UUID

from app.schemas.domain_config import DomainConfigPayload
from app.schemas.upload import UploadMetadata


@dataclass(frozen=True)
class ProviderConfig:
    provider: str
    model: str
    timeout_seconds: int
    temperature: float
    max_tokens: int
    domain_id: str
    flow: str


@dataclass(frozen=True)
class RawProviderResult:
    payload: dict[str, Any]
    token_usage_estimate: int


@dataclass(frozen=True)
class OutputGenerationResult:
    output: dict[str, Any]
    provider: str
    model: str
    latency_ms: int
    token_usage_estimate: int


class OutputProvider(Protocol):
    """Contract for providers that produce output payloads."""

    def generate_output(
        self,
        *,
        job_id: UUID,
        domain_cfg: DomainConfigPayload,
        metadata: UploadMetadata,
        config: ProviderConfig,
    ) -> RawProviderResult: ...
