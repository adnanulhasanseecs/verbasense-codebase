"""Resolve ASR configuration (env + account overlay) and transcribe audio."""

from __future__ import annotations

from typing import Any
from uuid import UUID

import httpx

from app.api.exceptions import BadRequestError
from app.asr.mock_provider import MockAsrProvider
from app.asr.openai_compatible_provider import OpenAICompatibleAsrProvider
from app.config.settings import Settings
from app.schemas.domain_config import DomainConfigPayload
from app.schemas.output import TranscriptSegment
from app.schemas.upload import UploadMetadata


def _overlay_str(overlay: dict[str, Any] | None, key: str, default: str) -> str:
    if not overlay:
        return default
    value = overlay.get(key)
    if value is None:
        return default
    return str(value).strip()


def transcribe_for_job(
    *,
    settings: Settings,
    overlay: dict[str, Any] | None,
    job_id: UUID,
    audio_bytes: bytes,
    metadata: UploadMetadata,
    domain_cfg: DomainConfigPayload,
) -> list[TranscriptSegment]:
    provider = (
        _overlay_str(overlay, "asr_provider", settings.asr_provider) or settings.asr_provider
    ).strip().lower()
    model = _overlay_str(overlay, "asr_model", "")
    if not model:
        model = _overlay_str(overlay, "speech_engine", "")
    if not model:
        model = settings.asr_model
    base_url = _overlay_str(overlay, "asr_base_url", settings.asr_base_url)
    api_key = _overlay_str(overlay, "asr_api_key", settings.asr_api_key)
    timeout_raw = overlay.get("asr_timeout_seconds") if overlay else None
    if isinstance(timeout_raw, (int, float)) and int(timeout_raw) >= 1:
        timeout_seconds = float(int(timeout_raw))
    else:
        timeout_seconds = float(settings.asr_timeout_seconds)

    if settings.strict_real_providers and provider in {"mock", "mock_asr", "demo"}:
        raise BadRequestError(
            "mock_provider_disabled",
            "Mock ASR is disabled when STRICT_REAL_PROVIDERS is enabled",
        )

    if provider in {"mock", "mock_asr"}:
        return MockAsrProvider().transcribe(
            job_id=job_id,
            audio_bytes=audio_bytes,
            metadata=metadata,
            domain_cfg=domain_cfg,
        )

    if provider in {"openai", "openai-compatible", "self-hosted-whisper", "on-prem-whisper"}:
        adapter = OpenAICompatibleAsrProvider(settings)
        try:
            return adapter.transcribe_with(
                job_id=job_id,
                audio_bytes=audio_bytes,
                metadata=metadata,
                domain_cfg=domain_cfg,
                api_key=api_key,
                base_url=base_url,
                model=model,
                timeout_seconds=timeout_seconds,
            )
        except httpx.TimeoutException as exc:
            raise BadRequestError(
                "asr_timeout",
                "ASR request timed out; check network, base URL, and timeout settings",
                {"detail": str(exc)},
            ) from exc
        except httpx.RequestError as exc:
            raise BadRequestError(
                "asr_connect_failed",
                "Could not reach ASR endpoint; verify ASR base URL and TLS/network",
                {"detail": str(exc)},
            ) from exc

    return MockAsrProvider().transcribe(
        job_id=job_id,
        audio_bytes=audio_bytes,
        metadata=metadata,
        domain_cfg=domain_cfg,
    )
