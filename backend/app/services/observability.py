"""Lightweight in-process metrics for observability and SLO checks."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from time import monotonic
from typing import Any


@dataclass
class _MetricsState:
    requests_total: int = 0
    requests_by_path: dict[str, int] | None = None
    requests_by_status: dict[str, int] | None = None
    ai_requests_total: int = 0
    ai_latency_samples_ms: list[int] | None = None

    def __post_init__(self) -> None:
        self.requests_by_path = defaultdict(int)
        self.requests_by_status = defaultdict(int)
        self.ai_latency_samples_ms = []


_state = _MetricsState()


def record_request(path: str, status_code: int, elapsed_ms: int) -> None:
    _state.requests_total += 1
    _state.requests_by_path[path] += 1
    _state.requests_by_status[str(status_code)] += 1
    if path.startswith("/api/v1/documents/") or path.startswith("/api/v1/upload"):
        _state.ai_requests_total += 1
        _state.ai_latency_samples_ms.append(elapsed_ms)
        if len(_state.ai_latency_samples_ms) > 2000:
            _state.ai_latency_samples_ms = _state.ai_latency_samples_ms[-1000:]


def snapshot() -> dict[str, Any]:
    lat = sorted(_state.ai_latency_samples_ms)
    p95 = lat[int(len(lat) * 0.95) - 1] if lat else 0
    return {
        "requests_total": _state.requests_total,
        "requests_by_path": dict(_state.requests_by_path),
        "requests_by_status": dict(_state.requests_by_status),
        "ai_requests_total": _state.ai_requests_total,
        "ai_latency_p95_ms": max(0, p95),
        "ai_latency_sample_count": len(lat),
    }


def now_ms() -> int:
    return int(monotonic() * 1000)
