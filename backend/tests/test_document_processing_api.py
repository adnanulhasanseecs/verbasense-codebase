"""Document processing API tests (manual LLM trigger flow)."""

from __future__ import annotations

from typing import Any

from app.services.document_processing import DocumentProcessingService
from fastapi.testclient import TestClient


def _login(client: TestClient) -> str:
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@verbasense.local", "password": "Admin@12345"},
    )
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def test_document_process_requires_auth(client: TestClient) -> None:
    r = client.post(
        "/api/v1/documents/process",
        data={
            "prompt": "extract",
            "provider": "mock",
            "model": "mock-doc-v1",
            "api_key": "",
            "base_url": "https://api.openai.com/v1",
        },
        files={"file": ("sample.pdf", b"%PDF-1.4\n...", "application/pdf")},
    )
    assert r.status_code == 401


def test_document_process_mock_flow(client: TestClient, monkeypatch) -> None:
    token = _login(client)

    monkeypatch.setattr(
        DocumentProcessingService,
        "_extract_pdf_text",
        lambda self, _: (
            "Case ID: CR-2026-118\nJudge: Hon. Avery Cole\n"
            "Parties: State, R. Morales\nEvidence: Exhibit A, Exhibit C\n"
            "Section 2. Key Points\n2026-04-06"
        ),
    )

    r = client.post(
        "/api/v1/documents/process",
        headers={"Authorization": f"Bearer {token}"},
        data={
            "prompt": "Extract summary, entities, key points, and referenced sections.",
            "provider": "mock",
            "model": "mock-doc-v1",
            "api_key": "",
            "base_url": "https://api.openai.com/v1",
        },
        files={"file": ("sample.pdf", b"%PDF-1.4\n...", "application/pdf")},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["provider"] == "mock"
    assert body["model"] == "mock-doc-v1"
    assert body["entities"]["case_id"] == "CR-2026-118"
    assert body["entities"]["judge"].startswith("Hon.")
    assert len(body["key_points"]) >= 1


def test_document_process_non_mock_requires_api_key(client: TestClient, monkeypatch) -> None:
    token = _login(client)
    monkeypatch.setattr(DocumentProcessingService, "_extract_pdf_text", lambda self, _: "x")
    r = client.post(
        "/api/v1/documents/process",
        headers={"Authorization": f"Bearer {token}"},
        data={
            "prompt": "Extract",
            "provider": "openai",
            "model": "gpt-4.1-mini",
            "api_key": "",
            "base_url": "https://api.openai.com/v1",
        },
        files={"file": ("sample.pdf", b"%PDF-1.4\n...", "application/pdf")},
    )
    assert r.status_code == 400
    assert r.json()["code"] == "missing_api_key"


def test_validate_key_endpoint_mock_provider(client: TestClient) -> None:
    token = _login(client)
    r = client.post(
        "/api/v1/documents/validate-key",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "provider": "mock",
            "base_url": "https://api.openai.com/v1",
            "api_key": "",
        },
    )
    assert r.status_code == 200, r.text
    assert r.json()["valid"] is True


def test_admin_ai_connections_roundtrip_masks_keys(client: TestClient) -> None:
    token = _login(client)
    save = client.put(
        "/api/v1/admin/ai-connections",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "asr_provider": "openai",
            "asr_model": "whisper-1",
            "asr_base_url": "https://api.openai.com/v1",
            "asr_api_key": "asr-secret",
            "deployment_mode": "cloud",
            "document_llm_provider": "openai-compatible",
            "document_llm_model_name": "Doc",
            "document_llm_model_value": "gpt-4.1-mini",
            "transcription_llm_model_name": "Trans",
            "transcription_llm_model_value": "gpt-4.1-mini",
            "document_llm_base_url": "https://api.openai.com/v1",
            "document_llm_api_key": "doc-secret",
        },
    )
    assert save.status_code == 200, save.text
    assert save.json()["has_asr_api_key"] is True
    assert save.json()["has_document_llm_api_key"] is True
    assert "asr_api_key" not in save.json()
    assert "document_llm_api_key" not in save.json()

    loaded = client.get(
        "/api/v1/admin/ai-connections",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert loaded.status_code == 200, loaded.text
    assert loaded.json()["has_document_llm_api_key"] is True


def test_document_process_uses_saved_backend_config(client: TestClient, monkeypatch) -> None:
    token = _login(client)
    client.put(
        "/api/v1/admin/ai-connections",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "asr_provider": "openai",
            "asr_model": "whisper-1",
            "asr_base_url": "https://api.openai.com/v1",
            "asr_api_key": "asr-secret",
            "deployment_mode": "cloud",
            "document_llm_provider": "openai-compatible",
            "document_llm_model_name": "Doc",
            "document_llm_model_value": "gpt-4.1-mini",
            "transcription_llm_model_name": "Trans",
            "transcription_llm_model_value": "gpt-4.1-mini",
            "document_llm_base_url": "https://api.openai.com/v1",
            "document_llm_api_key": "doc-secret",
        },
    )
    monkeypatch.setattr(
        DocumentProcessingService,
        "_extract_pdf_text",
        lambda self, _: "Case ID: X",
    )
    monkeypatch.setattr(
        DocumentProcessingService,
        "_openai_compatible_call",
        lambda self, **kwargs: {
            "summary": "ok",
            "key_points": ["k1"],
            "referenced_sections": ["s1"],
            "entities": {"case_id": "X", "judge": "J", "parties": [], "evidence": [], "dates": []},
        },
    )
    r = client.post(
        "/api/v1/documents/process",
        headers={"Authorization": f"Bearer {token}"},
        data={"prompt": "Extract"},
        files={"file": ("sample.pdf", b"%PDF-1.4\n...", "application/pdf")},
    )
    assert r.status_code == 200, r.text
    assert r.json()["summary"] == "ok"


def test_ai_connections_health_check(client: TestClient) -> None:
    token = _login(client)
    client.put(
        "/api/v1/admin/ai-connections",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "asr_provider": "mock",
            "asr_model": "mock-asr",
            "asr_base_url": "https://api.openai.com/v1",
            "deployment_mode": "cloud",
            "document_llm_provider": "mock",
            "document_llm_model_name": "Doc",
            "document_llm_model_value": "mock-doc",
            "transcription_llm_model_name": "Trans",
            "transcription_llm_model_value": "mock-trans",
            "document_llm_base_url": "https://api.openai.com/v1",
        },
    )
    r = client.post(
        "/api/v1/admin/ai-connections/health-check",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["document_llm"]["valid"] is True
    assert r.json()["asr"]["valid"] is True


def test_validate_key_openai_base_url_auto_normalizes_v1(monkeypatch) -> None:
    called: dict[str, Any] = {}

    class _DummyResponse:
        status_code = 200
        text = "ok"

    class _DummyClient:
        def __init__(self, *, timeout: float) -> None:
            _ = timeout

        def __enter__(self) -> _DummyClient:
            return self

        def __exit__(self, *_: object) -> None:
            return None

        def get(self, url: str, headers: dict[str, str]) -> _DummyResponse:
            called["url"] = url
            called["headers"] = headers
            return _DummyResponse()

    import app.services.document_processing as mod

    monkeypatch.setattr(mod.httpx, "Client", _DummyClient)
    svc = DocumentProcessingService()
    out = svc.validate_api_key(
        provider="openai-compatible",
        base_url="https://api.openai.com",
        api_key="sk-test",
    )
    assert out.valid is True
    assert called["url"] == "https://api.openai.com/v1/models"
