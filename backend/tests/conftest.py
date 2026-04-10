"""Pytest fixtures."""

import os

import pytest
from fastapi.testclient import TestClient

# Ensure mock pipeline is fast in tests
os.environ.setdefault("MOCK_DELAY", "0")
os.environ.setdefault("MOCK_FAILURE_RATE", "0")

from app.main import app  # noqa: E402
from app.services.job_service import reset_job_service_for_tests  # noqa: E402


@pytest.fixture
def client() -> TestClient:
    reset_job_service_for_tests()
    with TestClient(app) as c:
        yield c
    reset_job_service_for_tests()
