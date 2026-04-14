"""Document processing service with OpenAI-compatible routing."""

from __future__ import annotations

import json
import re
from io import BytesIO
from typing import Any, cast

import httpx
from pypdf import PdfReader

from app.api.exceptions import BadRequestError
from app.config.settings import Settings, get_settings
from app.schemas.document import (
    DocumentEntities,
    DocumentProcessResponse,
    LlmKeyValidationResponse,
)


class DocumentProcessingService:
    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()

    def validate_api_key(
        self, *, provider: str, base_url: str, api_key: str
    ) -> LlmKeyValidationResponse:
        if provider.strip().lower() in {"mock", "demo"}:
            return LlmKeyValidationResponse(
                valid=True,
                provider=provider,
                base_url=base_url,
                message="Mock provider does not require external key validation",
            )
        if not api_key.strip():
            return LlmKeyValidationResponse(
                valid=False,
                provider=provider,
                base_url=base_url,
                message="API key is required",
            )

        normalized_base_url = self._normalize_openai_base_url(provider=provider, base_url=base_url)
        url = f"{normalized_base_url.rstrip('/')}/models"
        try:
            with httpx.Client(timeout=20.0) as client:
                response = client.get(
                    url,
                    headers={"Authorization": f"Bearer {api_key}"},
                )
        except httpx.TimeoutException:
            return LlmKeyValidationResponse(
                valid=False,
                provider=provider,
                base_url=base_url,
                message="Connectivity timed out while calling /models",
            )
        except httpx.RequestError as exc:
            return LlmKeyValidationResponse(
                valid=False,
                provider=provider,
                base_url=base_url,
                message=f"Connectivity failed: {exc}",
            )

        if response.status_code == 200:
            return LlmKeyValidationResponse(
                valid=True,
                provider=provider,
                base_url=normalized_base_url,
                message="API key validated successfully",
            )
        if response.status_code == 404 and "api.openai.com" in normalized_base_url:
            return LlmKeyValidationResponse(
                valid=False,
                provider=provider,
                base_url=normalized_base_url,
                message=(
                    "Endpoint not found. For OpenAI, use base URL "
                    "https://api.openai.com/v1."
                ),
            )
        return LlmKeyValidationResponse(
            valid=False,
            provider=provider,
            base_url=normalized_base_url,
            message=f"Provider returned {response.status_code}: {response.text[:160]}",
        )

    def process(
        self,
        *,
        pdf_bytes: bytes,
        prompt: str,
        provider: str,
        model: str,
        api_key: str,
        base_url: str,
    ) -> DocumentProcessResponse:
        text = self._extract_pdf_text(pdf_bytes)
        if not text.strip():
            raise BadRequestError("empty_document", "Could not extract readable text from PDF")

        normalized_provider = provider.strip().lower()
        if self._settings.strict_real_providers and normalized_provider in {"mock", "demo"}:
            raise BadRequestError(
                "mock_provider_disabled",
                "Mock document processing is disabled when STRICT_REAL_PROVIDERS is enabled",
            )
        if normalized_provider in {"mock", "demo"}:
            return self._mock_from_text(text=text, prompt=prompt, provider=provider, model=model)

        if not api_key.strip():
            raise BadRequestError(
                "missing_api_key",
                "LLM API key is required for non-mock providers",
            )

        payload = self._openai_compatible_call(
            text=text,
            prompt=prompt,
            model=model,
            api_key=api_key,
            base_url=self._normalize_openai_base_url(provider=provider, base_url=base_url),
        )

        payload_obj = cast(dict[str, Any], payload)
        entities_obj = payload_obj.get("entities", {})
        entities = entities_obj if isinstance(entities_obj, dict) else {}

        return DocumentProcessResponse(
            summary=str(payload_obj.get("summary", "")),
            key_points=[str(x) for x in payload_obj.get("key_points", []) if isinstance(x, object)],
            referenced_sections=[
                str(x) for x in payload_obj.get("referenced_sections", []) if isinstance(x, object)
            ],
            entities=DocumentEntities(
                case_id=str(entities.get("case_id", "")),
                judge=str(entities.get("judge", "")),
                parties=[str(x) for x in entities.get("parties", []) if isinstance(x, object)],
                evidence=[str(x) for x in entities.get("evidence", []) if isinstance(x, object)],
                dates=[str(x) for x in entities.get("dates", []) if isinstance(x, object)],
            ),
            provider=provider,
            model=model,
            prompt_used="internal_standard_prompt_v1",
        )

    def _extract_pdf_text(self, pdf_bytes: bytes) -> str:
        reader = PdfReader(BytesIO(pdf_bytes))
        chunks: list[str] = []
        for page in reader.pages:
            chunks.append(page.extract_text() or "")
        text = "\n".join(chunks)
        return text[:32000]

    def _openai_compatible_call(
        self,
        *,
        text: str,
        prompt: str,
        model: str,
        api_key: str,
        base_url: str,
    ) -> dict[str, object]:
        url = f"{base_url.rstrip('/')}/chat/completions"
        system_prompt = (
            "You extract structured legal document intelligence. "
            "Return ONLY valid JSON with keys: summary, key_points, referenced_sections, entities. "
            "entities must include: case_id, judge, parties, evidence, dates."
        )
        user_prompt = f"Instruction: {prompt}\n\n" f"Document text:\n{text}"

        try:
            with httpx.Client(timeout=45.0) as client:
                response = client.post(
                    url,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model,
                        "temperature": 0.1,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                    },
                )
        except httpx.TimeoutException as exc:
            raise BadRequestError(
                "llm_timeout",
                "LLM request timed out; check base URL, model availability, and network",
                {"detail": str(exc)},
            ) from exc
        except httpx.RequestError as exc:
            raise BadRequestError(
                "llm_connect_failed",
                "Could not reach LLM endpoint; verify base URL and TLS/network",
                {"detail": str(exc)},
            ) from exc
        if response.status_code >= 400:
            raise BadRequestError(
                "llm_request_failed",
                f"LLM provider returned {response.status_code}",
                {"body": response.text[:400]},
            )

        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        if not isinstance(content, str) or not content.strip():
            raise BadRequestError("llm_empty_response", "LLM returned empty response")

        parsed = self._parse_json_content(content)
        if not isinstance(parsed, dict):
            raise BadRequestError("llm_invalid_json", "LLM output is not valid JSON object")
        return parsed

    def _parse_json_content(self, content: str) -> object:
        stripped = content.strip()
        fenced = re.match(r"^```(?:json)?\s*(.*?)\s*```$", stripped, re.DOTALL)
        payload = fenced.group(1) if fenced else stripped
        return json.loads(payload)

    def _mock_from_text(
        self,
        *,
        text: str,
        prompt: str,
        provider: str,
        model: str,
    ) -> DocumentProcessResponse:
        lines = [x.strip() for x in text.splitlines() if x.strip()]
        summary = lines[0] if lines else "No summary extracted"

        case_id = self._extract_regex(r"Case ID:\s*([A-Za-z0-9\-]+)", text)
        judge = self._extract_regex(r"Judge:\s*([^|\n]+)", text)
        parties_text = self._extract_regex(r"Parties:\s*([^|\n]+)", text)
        evidence_text = self._extract_regex(r"Evidence:\s*([^|\n]+)", text)

        dates = re.findall(r"\b\d{4}-\d{2}-\d{2}\b", text)
        key_points = [ln for ln in lines if "key" in ln.lower() or ln.startswith("1)")][:5]
        referenced = [ln for ln in lines if "section" in ln.lower() or "ref" in ln.lower()][:5]

        return DocumentProcessResponse(
            summary=summary,
            key_points=key_points or lines[1:4],
            referenced_sections=referenced or ["No referenced sections detected"],
            entities=DocumentEntities(
                case_id=case_id or "unknown",
                judge=judge or "unknown",
                parties=[x.strip() for x in parties_text.split(",")] if parties_text else [],
                evidence=[x.strip() for x in evidence_text.split(",")] if evidence_text else [],
                dates=dates,
            ),
            provider=provider,
            model=model,
            prompt_used="internal_standard_prompt_v1",
        )

    def _extract_regex(self, pattern: str, text: str) -> str | None:
        match = re.search(pattern, text)
        if not match:
            return None
        return match.group(1).strip()

    def _normalize_openai_base_url(self, *, provider: str, base_url: str) -> str:
        cleaned = base_url.strip().rstrip("/")
        if not cleaned:
            return "https://api.openai.com/v1"
        provider_key = provider.strip().lower()
        is_openai_like = "openai" in provider_key or "compatible" in provider_key
        if is_openai_like and "api.openai.com" in cleaned and not cleaned.endswith("/v1"):
            return f"{cleaned}/v1"
        return cleaned


def get_document_processing_service() -> DocumentProcessingService:
    return DocumentProcessingService(get_settings())
