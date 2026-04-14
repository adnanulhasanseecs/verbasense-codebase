"""OpenAI-compatible provider for transcription intelligence output."""

from __future__ import annotations

import json

import httpx

from app.api.exceptions import BadRequestError
from app.config.settings import Settings
from app.providers.types import ProviderConfig, RawProviderResult
from app.schemas.domain_config import DomainConfigPayload
from app.schemas.output import TranscriptSegment
from app.schemas.upload import UploadMetadata


class OpenAICompatibleOutputProvider:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def generate_output(
        self,
        *,
        job_id,
        domain_cfg: DomainConfigPayload,
        metadata: UploadMetadata,
        config: ProviderConfig,
        transcript: list[TranscriptSegment] | None = None,
    ) -> RawProviderResult:
        _ = (job_id, domain_cfg, metadata)
        api_key = (config.llm_api_key or self._settings.output_api_key).strip()
        if not api_key:
            raise BadRequestError(
                "missing_output_api_key",
                "Transcription intelligence API key is not configured",
            )
        if not transcript:
            raise ValueError("Transcript is required for transcription intelligence call")

        transcript_text = "\n".join(f"{seg.speaker}: {seg.text}" for seg in transcript)
        prompt = (
            "Return strict JSON with keys: summary (string), key_decisions (string[]), "
            "actions (array of {text, owner, priority}), entities (array of {type, value}), "
            "schema_version (string)."
        )
        base_url = (config.llm_base_url or self._settings.output_base_url).rstrip("/")
        url = f"{base_url}/chat/completions"
        payload = {
            "model": config.model,
            "temperature": config.temperature,
            "max_tokens": config.max_tokens,
            "messages": [
                {
                    "role": "system",
                    "content": "You extract legal-session intelligence from transcripts.",
                },
                {"role": "user", "content": f"{prompt}\n\nTranscript:\n{transcript_text}"},
            ],
            "response_format": {"type": "json_object"},
        }
        try:
            with httpx.Client(timeout=float(config.timeout_seconds)) as client:
                response = client.post(
                    url,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
        except httpx.TimeoutException as exc:
            raise BadRequestError(
                "output_timeout",
                "Transcription intelligence request timed out; check base URL and network",
                {"detail": str(exc)},
            ) from exc
        except httpx.RequestError as exc:
            raise BadRequestError(
                "output_connect_failed",
                "Could not reach transcription intelligence endpoint",
                {"detail": str(exc)},
            ) from exc
        if response.status_code >= 400:
            raise BadRequestError(
                "output_request_failed",
                f"Output provider returned {response.status_code}",
                {"body": response.text[:300]},
            )

        data = response.json()
        content = data["choices"][0]["message"]["content"]
        parsed = json.loads(content) if isinstance(content, str) else content
        usage = data.get("usage", {}) if isinstance(data.get("usage"), dict) else {}
        token_estimate = int(usage.get("total_tokens", max(1, len(transcript_text) // 4)))

        parsed["transcript"] = [segment.model_dump(mode="json") for segment in transcript]
        if "schema_version" not in parsed:
            parsed["schema_version"] = "v1"
        return RawProviderResult(payload=parsed, token_usage_estimate=token_estimate)
