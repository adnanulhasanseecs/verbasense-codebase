"""Security/ops hardening tests for C5/C6 controls."""

from __future__ import annotations

from app.config.settings import Settings
from app.security.redaction import redact
from app.security.secrets import decrypt_secret, encrypt_secret
from fastapi.testclient import TestClient


def test_secret_encryption_round_trip() -> None:
    settings = Settings(SECRET_ENCRYPTION_KEY="Q3Vf5fzyD5iQ4gMdk8mySx8JKQf86A3R8ZDWWFj8-rA=")
    token = encrypt_secret("sk-live-123", settings)
    assert token.startswith("enc::")
    restored = decrypt_secret(token, settings)
    assert restored == "sk-live-123"


def test_redaction_scrubs_sensitive_fields() -> None:
    payload = {
        "api_key": "abc",
        "nested": {"token": "tkn", "safe": "ok"},
        "prompt": "please summarize",
    }
    out = redact(payload)
    assert out["api_key"] == "<redacted>"
    assert out["nested"]["token"] == "<redacted>"
    assert out["nested"]["safe"] == "ok"
    assert out["prompt"] == "<redacted>"


def test_ops_metrics_endpoint_admin_access(client: TestClient) -> None:
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@verbasense.local", "password": "Admin@12345"},
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]

    metrics = client.get("/api/v1/ops/metrics", headers={"Authorization": f"Bearer {token}"})
    assert metrics.status_code == 200, metrics.text
    body = metrics.json()
    assert "requests_total" in body
    assert "ai_latency_p95_ms" in body


def test_rate_limit_auth_bucket(monkeypatch, client: TestClient) -> None:
    import app.main as main_mod

    monkeypatch.setattr(main_mod._rate_limiter, "allow", lambda *args, **kwargs: False)
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@verbasense.local", "password": "wrong-pass"},
    )
    assert response.status_code == 429
    assert response.json()["code"] == "rate_limited"
