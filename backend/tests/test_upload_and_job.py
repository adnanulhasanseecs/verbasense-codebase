"""Upload and job lifecycle."""

import io
import time

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
