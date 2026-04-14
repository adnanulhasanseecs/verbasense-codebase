"""OpenAI-compatible ASR provider (cloud/self-hosted)."""

from __future__ import annotations

from io import BytesIO
from uuid import UUID

import httpx

from app.api.exceptions import BadRequestError
from app.config.settings import Settings
from app.schemas.domain_config import DomainConfigPayload
from app.schemas.output import TranscriptSegment
from app.schemas.upload import UploadMetadata


class OpenAICompatibleAsrProvider:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def transcribe(
        self,
        *,
        job_id: UUID,
        audio_bytes: bytes,
        metadata: UploadMetadata,
        domain_cfg: DomainConfigPayload,
    ) -> list[TranscriptSegment]:
        return self.transcribe_with(
            job_id=job_id,
            audio_bytes=audio_bytes,
            metadata=metadata,
            domain_cfg=domain_cfg,
            api_key=self._settings.asr_api_key,
            base_url=self._settings.asr_base_url,
            model=self._settings.asr_model,
            timeout_seconds=float(self._settings.asr_timeout_seconds),
        )

    def transcribe_with(
        self,
        *,
        job_id: UUID,
        audio_bytes: bytes,
        metadata: UploadMetadata,
        domain_cfg: DomainConfigPayload,
        api_key: str,
        base_url: str,
        model: str,
        timeout_seconds: float,
    ) -> list[TranscriptSegment]:
        _ = (job_id, metadata, domain_cfg)
        if not api_key.strip():
            raise BadRequestError("missing_asr_api_key", "ASR API key is not configured")

        url = f"{base_url.rstrip('/')}/audio/transcriptions"
        files = {
            "file": ("audio.wav", BytesIO(audio_bytes), "audio/wav"),
            "model": (None, model),
        }
        with httpx.Client(timeout=timeout_seconds) as client:
            response = client.post(
                url, headers={"Authorization": f"Bearer {api_key.strip()}"}, files=files
            )

        if response.status_code >= 400:
            raise BadRequestError(
                "asr_request_failed",
                f"ASR provider returned {response.status_code}",
                {"body": response.text[:300]},
            )

        data = response.json()
        text = str(data.get("text", "")).strip()
        if not text:
            raise BadRequestError(
                "asr_empty_transcript",
                "ASR response did not include transcript text",
            )

        return [
            TranscriptSegment(
                speaker="Speaker",
                text=text,
                start_ms=0,
                end_ms=None,
            )
        ]
