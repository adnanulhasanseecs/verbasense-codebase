"""Redaction helpers to avoid leaking sensitive values in logs/errors."""

from __future__ import annotations

from typing import Any

_SENSITIVE_KEYS = {"api_key", "token", "password", "authorization", "prompt", "secret"}


def redact(value: Any) -> Any:
    if isinstance(value, dict):
        out: dict[str, Any] = {}
        for key, item in value.items():
            key_l = key.lower()
            if any(s in key_l for s in _SENSITIVE_KEYS):
                out[key] = "<redacted>"
            else:
                out[key] = redact(item)
        return out
    if isinstance(value, list):
        return [redact(item) for item in value]
    if isinstance(value, str):
        if len(value) > 256:
            return f"{value[:120]}...<truncated>...{value[-40:]}"
        return value
    return value
