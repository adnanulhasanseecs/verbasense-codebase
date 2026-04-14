"""Load persisted account AI configuration for background jobs."""

from __future__ import annotations

from typing import Any

from app.config.settings import Settings
from app.db.models import AccountModel
from app.db.session import session_scope


def load_account_ai_overlay(settings: Settings, account_id: str | None) -> dict[str, Any] | None:
    if not account_id:
        return None
    with session_scope(settings) as session:
        account = session.get(AccountModel, account_id)
        if account is None or not account.ai_connections:
            return None
        return dict(account.ai_connections)
