"""ASR provider cloud and self-hosted path tests."""

from __future__ import annotations

from typing import Any
from uuid import uuid4

from app.asr.factory import get_asr_provider
from app.asr.openai_compatible_provider import OpenAICompatibleAsrProvider
from app.config.settings import get_settings
from app.schemas.domain_config import DomainConfigPayload
from app.schemas.upload import UploadMetadata


def _domain() -> DomainConfigPayload:
    return DomainConfigPayload.model_validate(
        {
            "id": "courtsense",
            "domain": "judicial",
            "features": ["transcription"],
            "ui": {
                "name": "CourtSense",
                "labels": {
                    "summary": "Summary",
                    "actions": "Actions",
                    "decisions": "Decisions",
                },
            },
            "pipeline": {"stages": ["audio_received", "transcription"]},
            "entities": ["case"],
        }
    )


class _DummyResponse:
    def __init__(self, status_code: int, payload: dict[str, Any]) -> None:
        self.status_code = status_code
        self._payload = payload
        self.text = str(payload)

    def json(self) -> dict[str, Any]:
        return self._payload


class _DummyClient:
    def __init__(self, *, timeout: float) -> None:
        self.timeout = timeout

    def __enter__(self) -> _DummyClient:
        return self

    def __exit__(self, *_: object) -> None:
        return None

    def post(self, url: str, headers: dict[str, str], files: dict[str, Any]) -> _DummyResponse:
        _ = (headers, files)
        return _DummyResponse(200, {"text": f"transcribed from {url}"})


def test_openai_cloud_asr_path(monkeypatch) -> None:
    monkeypatch.setenv("ASR_PROVIDER", "openai")
    monkeypatch.setenv("ASR_BASE_URL", "https://api.openai.com/v1")
    monkeypatch.setenv("ASR_API_KEY", "cloud-key")
    get_settings.cache_clear()

    import app.asr.openai_compatible_provider as mod

    monkeypatch.setattr(mod.httpx, "Client", _DummyClient)
    provider = get_asr_provider(get_settings())
    assert isinstance(provider, OpenAICompatibleAsrProvider)

    segments = provider.transcribe(
        job_id=uuid4(),
        audio_bytes=b"RIFF" + (b"\x00" * 32),
        metadata=UploadMetadata(case_id="CASE-1"),
        domain_cfg=_domain(),
    )
    assert len(segments) == 1
    assert "api.openai.com" in segments[0].text


def test_self_hosted_asr_path(monkeypatch) -> None:
    monkeypatch.setenv("ASR_PROVIDER", "self-hosted-whisper")
    monkeypatch.setenv("ASR_BASE_URL", "http://localhost:8001/v1")
    monkeypatch.setenv("ASR_API_KEY", "local-key")
    get_settings.cache_clear()

    import app.asr.openai_compatible_provider as mod

    monkeypatch.setattr(mod.httpx, "Client", _DummyClient)
    provider = get_asr_provider(get_settings())
    assert isinstance(provider, OpenAICompatibleAsrProvider)

    segments = provider.transcribe(
        job_id=uuid4(),
        audio_bytes=b"RIFF" + (b"\x00" * 32),
        metadata=UploadMetadata(),
        domain_cfg=_domain(),
    )
    assert len(segments) == 1
    assert "localhost:8001" in segments[0].text
