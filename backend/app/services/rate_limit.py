"""Simple in-memory fixed-window rate limiting."""

from __future__ import annotations

from collections import defaultdict, deque
from time import monotonic

from app.config.settings import Settings


class RateLimiter:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, key: str, *, bucket: str) -> bool:
        now = monotonic()
        window = float(self._settings.rate_limit_window_seconds)
        if bucket == "auth":
            limit = self._settings.rate_limit_auth_per_window
        elif bucket == "admin":
            limit = self._settings.rate_limit_admin_per_window
        else:
            limit = self._settings.rate_limit_ai_per_window
        q = self._hits[f"{bucket}:{key}"]
        while q and now - q[0] > window:
            q.popleft()
        if len(q) >= limit:
            return False
        q.append(now)
        return True
