"""Domain config endpoint."""

from fastapi.testclient import TestClient


def test_get_domain_config(client: TestClient) -> None:
    r = client.get("/api/v1/config/domain/courtsense")
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == "courtsense"
    assert data["ui"]["name"] == "CourtSense"


def test_unknown_domain(client: TestClient) -> None:
    r = client.get("/api/v1/config/domain/unknown")
    assert r.status_code == 404
    err = r.json()
    assert "code" in err and "request_id" in err
