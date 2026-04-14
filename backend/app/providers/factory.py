"""Provider selection, routing, validation, and fallback orchestration."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from time import monotonic
from uuid import UUID

from pydantic import ValidationError

from app.api.exceptions import BadRequestError
from app.config.settings import Settings
from app.providers.failing_provider import FailingOutputProvider
from app.providers.invalid_provider import InvalidOutputProvider
from app.providers.mock_provider import MockOutputProvider
from app.providers.openai_compatible_provider import OpenAICompatibleOutputProvider
from app.providers.types import (
    OutputGenerationResult,
    OutputProvider,
    ProviderConfig,
)
from app.schemas.domain_config import DomainConfigPayload
from app.schemas.output import OutputSchema, TranscriptSegment
from app.schemas.upload import UploadMetadata

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ProviderRoute:
    primary_provider: str
    fallback_providers: list[str]
    model: str


class RoutedOutputProvider:
    """Routes by domain, validates output schema, and applies fallback chain."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._providers = _provider_registry(settings)
        self._provider_overrides = _parse_json_map(settings.output_provider_by_domain_json)
        self._model_overrides = _parse_json_map(settings.output_model_by_domain_json)

    def generate_output(
        self,
        *,
        job_id: UUID,
        domain_cfg: DomainConfigPayload,
        metadata: UploadMetadata,
        flow: str = "output",
        transcript: list[TranscriptSegment] | None = None,
        account_overlay: dict[str, object] | None = None,
    ) -> OutputGenerationResult:
        route = self.resolve_route(domain_id=domain_cfg.id, flow=flow)
        primary_provider = route.primary_provider
        fallback_providers = list(route.fallback_providers)
        model_name = route.model
        llm_base_url: str | None = None
        llm_api_key: str | None = None

        if flow == "transcription_intelligence" and account_overlay:
            provider_override = account_overlay.get("document_llm_provider")
            if isinstance(provider_override, str) and provider_override.strip():
                primary_provider = provider_override.strip()
            model_override = account_overlay.get("transcription_llm_model_value")
            if isinstance(model_override, str) and model_override.strip():
                model_name = model_override.strip()
            base_override = account_overlay.get("document_llm_base_url")
            if isinstance(base_override, str) and base_override.strip():
                llm_base_url = base_override.strip()
            key_override = account_overlay.get("document_llm_api_key")
            if isinstance(key_override, str) and key_override.strip():
                llm_api_key = key_override.strip()

        if (
            self._settings.strict_real_providers
            and flow == "transcription_intelligence"
            and primary_provider.strip().lower() == "mock"
        ):
            raise BadRequestError(
                "mock_provider_disabled",
                "Mock transcription intelligence is disabled when STRICT_REAL_PROVIDERS is enabled",
            )

        provider_chain = [primary_provider, *fallback_providers]

        last_error: Exception | None = None
        for provider_key in provider_chain:
            provider = self._providers.get(provider_key)
            if provider is None:
                last_error = ValueError(f"Unsupported output provider: {provider_key}")
                continue

            config = ProviderConfig(
                provider=provider_key,
                model=model_name,
                timeout_seconds=self._settings.output_timeout_seconds,
                temperature=self._settings.output_temperature,
                max_tokens=self._settings.output_max_tokens,
                domain_id=domain_cfg.id,
                flow=flow,
                llm_base_url=llm_base_url,
                llm_api_key=llm_api_key,
            )
            try:
                started = monotonic()
                raw_payload = provider.generate_output(
                    job_id=job_id,
                    domain_cfg=domain_cfg,
                    metadata=metadata,
                    config=config,
                    transcript=transcript,
                )
                validated = OutputSchema.model_validate(raw_payload.payload)
                return OutputGenerationResult(
                    output=validated.model_dump(mode="json"),
                    provider=provider_key,
                    model=model_name,
                    latency_ms=max(0, int((monotonic() - started) * 1000)),
                    token_usage_estimate=raw_payload.token_usage_estimate,
                )
            except BadRequestError:
                raise
            except (ValidationError, RuntimeError, ValueError) as e:
                logger.warning(
                    "output_provider_failed",
                    extra={
                        "provider": provider_key,
                        "model": route.model,
                        "domain": domain_cfg.id,
                        "error": str(e),
                    },
                )
                last_error = e
                continue

        msg = "All output providers failed"
        if last_error is not None:
            raise RuntimeError(f"{msg}: {last_error}") from last_error
        raise RuntimeError(msg)

    def resolve_route(self, *, domain_id: str, flow: str) -> ProviderRoute:
        primary_provider = self._provider_overrides.get(domain_id, self._settings.output_provider)
        fallback_providers = [
            p.strip() for p in self._settings.output_fallback_providers.split(",") if p.strip()
        ]
        default_model = (
            self._settings.transcription_intelligence_model
            if flow == "transcription_intelligence"
            else self._settings.output_model
        )
        model = self._model_overrides.get(domain_id, default_model)
        return ProviderRoute(
            primary_provider=primary_provider,
            fallback_providers=fallback_providers,
            model=model,
        )


def get_output_provider(settings: Settings) -> RoutedOutputProvider:
    return RoutedOutputProvider(settings)


def _parse_json_map(raw: str | None) -> dict[str, str]:
    if raw is None or raw.strip() == "":
        return {}
    data = json.loads(raw)
    if not isinstance(data, dict):
        msg = "Provider override env vars must be JSON object maps"
        raise ValueError(msg)
    out: dict[str, str] = {}
    for k, v in data.items():
        if isinstance(k, str) and isinstance(v, str):
            out[k] = v
    return out


def _provider_registry(settings: Settings) -> dict[str, OutputProvider]:
    return {
        "mock": MockOutputProvider(),
        "openai-compatible": OpenAICompatibleOutputProvider(settings),
        # Test-only providers used to exercise fallback/validation behavior.
        "failing": FailingOutputProvider(),
        "invalid": InvalidOutputProvider(),
    }
