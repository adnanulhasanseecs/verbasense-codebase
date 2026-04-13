"""API error contract, edge paths, and request_id shape (no external services)."""

from __future__ import annotations

import io
import uuid
from typing import Any
from uuid import UUID

import pytest
from app.config.settings import get_settings
from app.services.job_service import reset_job_service_for_tests
from fastapi.testclient import TestClient


def _assert_error_envelope(body: dict[str, Any]) -> None:
    assert "code" in body
    assert "message" in body
    assert "details" in body
    assert "request_id" in body
    rid = body["request_id"]
    assert isinstance(rid, str)
    UUID(rid)  # valid UUID string


def _wav_bytes(n: int = 64) -> io.BytesIO:
    return io.BytesIO(b"RIFF" + b"\x00" * max(0, n - 4))


def test_upload_oversize_returns_413(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("MAX_UPLOAD_BYTES", "80")
    get_settings.cache_clear()
    reset_job_service_for_tests()
    buf = _wav_bytes(200)
    r = client.post(
        "/api/v1/upload",
        files={"file": ("case.wav", buf, "audio/wav")},
        data={"domain": "courtsense"},
    )
    assert r.status_code == 413, r.text
    err = r.json()
    _assert_error_envelope(err)
    assert err["code"] == "payload_too_large"
    assert err["details"].get("max_bytes") == 80


def test_upload_invalid_metadata_returns_400(client: TestClient) -> None:
    buf = _wav_bytes()
    r = client.post(
        "/api/v1/upload",
        files={"file": ("case.wav", buf, "audio/wav")},
        data={"domain": "courtsense", "metadata": "{not-json"},
    )
    assert r.status_code == 400, r.text
    err = r.json()
    _assert_error_envelope(err)
    assert err["code"] == "invalid_metadata"


def test_get_job_unknown_id_returns_404(client: TestClient) -> None:
    jid = uuid.uuid4()
    r = client.get(f"/api/v1/job/{jid}")
    assert r.status_code == 404, r.text
    err = r.json()
    _assert_error_envelope(err)


def test_get_result_unknown_job_returns_404(client: TestClient) -> None:
    jid = uuid.uuid4()
    r = client.get(f"/api/v1/result/{jid}")
    assert r.status_code == 404, r.text
    err = r.json()
    _assert_error_envelope(err)


def test_get_result_not_ready_returns_404(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """While pipeline is still running, output is None -> result_not_ready."""
    monkeypatch.setenv("MOCK_DELAY", "5000")
    get_settings.cache_clear()
    reset_job_service_for_tests()
    buf = _wav_bytes()
    up = client.post(
        "/api/v1/upload",
        files={"file": ("case.wav", buf, "audio/wav")},
        data={"domain": "courtsense"},
    )
    assert up.status_code == 201, up.text
    jid = up.json()["id"]
    rr = client.get(f"/api/v1/result/{jid}")
    assert rr.status_code == 404, rr.text
    err = rr.json()
    _assert_error_envelope(err)
    assert err["message"] == "result_not_ready"


def test_get_result_failed_job_returns_409(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Force mock failure via env (more reliable than headers under TestClient)."""
    monkeypatch.setenv("MOCK_FAILURE_RATE", "1.0")
    monkeypatch.setenv("MOCK_DELAY", "0")
    get_settings.cache_clear()
    reset_job_service_for_tests()

    buf = _wav_bytes()
    up = client.post(
        "/api/v1/upload",
        files={"file": ("case.wav", buf, "audio/wav")},
        data={"domain": "courtsense"},
    )
    assert up.status_code == 201, up.text
    jid = up.json()["id"]

    import time

    deadline = time.time() + 15
    status = ""
    while time.time() < deadline:
        jr = client.get(f"/api/v1/job/{jid}")
        assert jr.status_code == 200
        status = jr.json()["status"]
        if status == "failed":
            break
        time.sleep(0.05)
    assert status == "failed"

    rr = client.get(f"/api/v1/result/{jid}")
    assert rr.status_code == 409, rr.text
    err = rr.json()
    _assert_error_envelope(err)
    assert err["message"] == "job_failed"


def test_invalid_uuid_path_job_returns_422(client: TestClient) -> None:
    r = client.get("/api/v1/job/not-a-uuid")
    assert r.status_code == 422, r.text
    err = r.json()
    _assert_error_envelope(err)
    assert err["code"] == "validation_error"


def test_invalid_uuid_path_result_returns_422(client: TestClient) -> None:
    r = client.get("/api/v1/result/not-a-uuid")
    assert r.status_code == 422, r.text
    err = r.json()
    _assert_error_envelope(err)
    assert err["code"] == "validation_error"


def test_error_responses_include_request_id_uuid(client: TestClient) -> None:
    """Spot-check several paths for §2.5 request_id field."""
    checks = [
        lambda: client.post(
            "/api/v1/upload", files={"file": ("x.txt", io.BytesIO(b"a"), "text/plain")}
        ),
        lambda: client.get(f"/api/v1/job/{uuid.uuid4()}"),
        lambda: client.get("/api/v1/config/domain/unknown-domain-xyz"),
    ]
    for call in checks:
        resp = call()
        assert resp.status_code >= 400
        body = resp.json()
        _assert_error_envelope(body)
