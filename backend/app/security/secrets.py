"""Secret encryption helpers for at-rest credential protection."""

from __future__ import annotations

from app.config.settings import Settings
from cryptography.fernet import Fernet, InvalidToken

_PREFIX = "enc::"


def _fernet(settings: Settings) -> Fernet | None:
    key = settings.secret_encryption_key.strip()
    if not key:
        return None
    return Fernet(key.encode("utf-8"))


def encrypt_secret(value: str | None, settings: Settings) -> str:
    raw = (value or "").strip()
    if not raw:
        return ""
    f = _fernet(settings)
    if f is None:
        return raw
    token = f.encrypt(raw.encode("utf-8")).decode("utf-8")
    return f"{_PREFIX}{token}"


def decrypt_secret(value: str | None, settings: Settings) -> str:
    raw = (value or "").strip()
    if not raw:
        return ""
    if not raw.startswith(_PREFIX):
        return raw
    f = _fernet(settings)
    if f is None:
        return ""
    token = raw.replace(_PREFIX, "", 1)
    try:
        return f.decrypt(token.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        return ""
