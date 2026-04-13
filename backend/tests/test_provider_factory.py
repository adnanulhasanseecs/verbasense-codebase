"""Provider factory and fallback tests for C2 routing."""

from __future__ import annotations

import uuid

import pytest
from app.config.settings import get_settings
from app.providers.factory import RoutedOutputProvider, get_output_provider
from app.schemas.domain_config import DomainConfigPayload
from app.schemas.upload import UploadMetadata


def _domain() -> DomainConfigPayload:
    return DomainConfigPayload.model_validate(
        {
            "id": "courtsense",
            "domain": "judicial",
            "features": ["transcription", "summarization", "action_items"],
            "ui": {
                "name": "CourtSense",
                "labels": {
                    "summary": "Proceedings Summary",
                    "actions": "Directives",
                    "decisions": "Key Decisions",
                },
            },
            "pipeline": {"stages": ["audio_received", "transcription", "summarization"]},
            "entities": ["case", "judge"],
        }
    )


def test_provider_factory_returns_routed_provider(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OUTPUT_PROVIDER", "mock")
    get_settings.cache_clear()
    provider = get_output_provider(get_settings())
    assert isinstance(provider, RoutedOutputProvider)


def test_resolve_route_uses_domain_overrides(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OUTPUT_PROVIDER", "mock")
    monkeypatch.setenv("OUTPUT_MODEL", "mock-v1")
    monkeypatch.setenv("OUTPUT_PROVIDER_BY_DOMAIN_JSON", '{"courtsense":"failing"}')
    monkeypatch.setenv("OUTPUT_MODEL_BY_DOMAIN_JSON", '{"courtsense":"gpt-4o-mini"}')
    monkeypatch.setenv("OUTPUT_FALLBACK_PROVIDERS", "mock")
    get_settings.cache_clear()
    routed = get_output_provider(get_settings())

    route = routed.resolve_route(domain_id="courtsense", flow="output")
    assert route.primary_provider == "failing"
    assert route.fallback_providers == ["mock"]
    assert route.model == "gpt-4o-mini"


def test_provider_fallback_on_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OUTPUT_PROVIDER", "failing")
    monkeypatch.setenv("OUTPUT_FALLBACK_PROVIDERS", "mock")
    get_settings.cache_clear()
    routed = get_output_provider(get_settings())

    result = routed.generate_output(
        job_id=uuid.uuid4(),
        domain_cfg=_domain(),
        metadata=UploadMetadata(case_id="CASE-1"),
    )
    assert result.provider == "mock"
    assert result.model == "mock-v1"
    assert result.latency_ms >= 0
    assert result.token_usage_estimate > 0
    assert result.output["schema_version"] == "v1"
    assert len(result.output["transcript"]) > 0


def test_provider_fallback_on_invalid_payload(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OUTPUT_PROVIDER", "invalid")
    monkeypatch.setenv("OUTPUT_FALLBACK_PROVIDERS", "mock")
    get_settings.cache_clear()
    routed = get_output_provider(get_settings())

    result = routed.generate_output(
        job_id=uuid.uuid4(),
        domain_cfg=_domain(),
        metadata=UploadMetadata(case_id="CASE-2"),
    )
    assert result.provider == "mock"
    assert result.output["schema_version"] == "v1"


def test_provider_chain_raises_when_all_fail(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OUTPUT_PROVIDER", "failing")
    monkeypatch.setenv("OUTPUT_FALLBACK_PROVIDERS", "invalid")
    get_settings.cache_clear()
    routed = get_output_provider(get_settings())

    with pytest.raises(RuntimeError, match="All output providers failed"):
        routed.generate_output(
            job_id=uuid.uuid4(),
            domain_cfg=_domain(),
            metadata=UploadMetadata(),
        )
