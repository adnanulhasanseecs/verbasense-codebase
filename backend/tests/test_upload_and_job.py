"""Upload and job lifecycle."""

import io
import time
from uuid import UUID

from app.services.job_service import get_job_service
from fastapi.testclient import TestClient


def _wav_file() -> tuple[str, io.BytesIO, str]:
    buf = io.BytesIO(b"RIFF" + b"\x00" * 32)
    return "case.wav", buf, "audio/wav"


def test_upload_and_poll_until_complete(client: TestClient) -> None:
    name, data, ctype = _wav_file()
    files = {"file": (name, data, ctype)}
    r = client.post(
        "/api/v1/upload",
        files=files,
        data={"domain": "courtsense", "metadata": '{"case_id":"X-1","courtroom":"A"}'},
    )
    assert r.status_code == 201, r.text
    job = r.json()
    jid = job["id"]
    assert job["status"] in ("queued", "processing")

    deadline = time.time() + 5
    status = job["status"]
    while status not in ("completed", "failed") and time.time() < deadline:
        jr = client.get(f"/api/v1/job/{jid}")
        assert jr.status_code == 200
        status = jr.json()["status"]
        if status == "completed":
            break
        time.sleep(0.05)

    assert status == "completed"


def test_reject_bad_extension(client: TestClient) -> None:
    buf = io.BytesIO(b"hello")
    r = client.post("/api/v1/upload", files={"file": ("x.txt", buf, "text/plain")})
    assert r.status_code == 400
    err = r.json()
    assert err["code"] == "invalid_file_type"


def test_unknown_domain_upload(client: TestClient) -> None:
    buf = io.BytesIO(b"RIFF" + b"\x00" * 8)
    r = client.post(
        "/api/v1/upload",
        files={"file": ("a.wav", buf, "audio/wav")},
        data={"domain": "nope"},
    )
    assert r.status_code == 400
    assert r.json()["code"] == "unknown_domain"


def test_get_result_when_ready(client: TestClient) -> None:
    name, data, ctype = _wav_file()
    r = client.post("/api/v1/upload", files={"file": (name, data, ctype)})
    jid = r.json()["id"]

    deadline = time.time() + 5
    while time.time() < deadline:
        jr = client.get(f"/api/v1/job/{jid}")
        if jr.json()["status"] == "completed":
            break
        time.sleep(0.05)

    rr = client.get(f"/api/v1/result/{jid}")
    assert rr.status_code == 200
    payload = rr.json()
    assert payload["output"]["schema_version"] == "v1"
    assert len(payload["output"]["transcript"]) >= 1


def test_upload_idempotency_key_reuses_existing_job(client: TestClient) -> None:
    name, data, ctype = _wav_file()
    r1 = client.post(
        "/api/v1/upload",
        files={"file": (name, data, ctype)},
        data={"domain": "courtsense"},
        headers={"X-Idempotency-Key": "case-courtsense-001"},
    )
    assert r1.status_code == 201

    name2, data2, ctype2 = _wav_file()
    r2 = client.post(
        "/api/v1/upload",
        files={"file": (name2, data2, ctype2)},
        data={"domain": "courtsense"},
        headers={"X-Idempotency-Key": "case-courtsense-001"},
    )
    assert r2.status_code == 201
    assert r1.json()["id"] == r2.json()["id"]


def test_completed_job_records_provider_telemetry(client: TestClient) -> None:
    name, data, ctype = _wav_file()
    up = client.post(
        "/api/v1/upload",
        files={"file": (name, data, ctype)},
        data={"domain": "courtsense"},
    )
    assert up.status_code == 201
    jid = up.json()["id"]

    deadline = time.time() + 8
    status = ""
    while time.time() < deadline:
        jr = client.get(f"/api/v1/job/{jid}")
        assert jr.status_code == 200
        status = jr.json()["status"]
        if status == "completed":
            break
        time.sleep(0.05)
    assert status == "completed"

    service = get_job_service()
    events = service._repo.list_events(UUID(jid))
    telemetry = None
    for e in reversed(events):
        maybe = e.payload.get("telemetry")
        if isinstance(maybe, dict):
            telemetry = maybe
            break

    assert telemetry is not None
    assert telemetry["provider"] == "mock"
    assert telemetry["model"] == "mock-v1"
    assert isinstance(telemetry["latency_ms"], int)
    assert telemetry["latency_ms"] >= 0
    assert isinstance(telemetry["token_usage_estimate"], int)
    assert telemetry["token_usage_estimate"] > 0
