"""Load and validate domain YAML files at startup."""

from pathlib import Path

import yaml
from app.config.settings import Settings
from app.schemas.domain_config import DomainConfigPayload
from pydantic import ValidationError


class DomainConfigStore:
    """In-memory registry of domain id -> validated config."""

    def __init__(self, by_id: dict[str, DomainConfigPayload]) -> None:
        self._by_id = by_id

    def get(self, domain_id: str) -> DomainConfigPayload | None:
        return self._by_id.get(domain_id)

    def ids(self) -> frozenset[str]:
        return frozenset(self._by_id.keys())


def _resolve_dir(settings: Settings) -> Path:
    raw = Path(settings.domains_config_dir)
    if raw.is_absolute():
        return raw
    # backend/app/config/loader.py -> backend/
    backend_root = Path(__file__).resolve().parent.parent.parent
    return (backend_root / raw).resolve()


def load_domain_configs(settings: Settings) -> DomainConfigStore:
    """Load all *.yaml from the domains directory and validate."""
    directory = _resolve_dir(settings)
    if not directory.is_dir():
        msg = f"Domain config directory not found: {directory}"
        raise FileNotFoundError(msg)

    by_id: dict[str, DomainConfigPayload] = {}
    for path in sorted(directory.glob("*.yaml")):
        with path.open(encoding="utf-8") as f:
            raw = yaml.safe_load(f)
        if not isinstance(raw, dict):
            msg = f"Invalid YAML (expected mapping): {path}"
            raise ValueError(msg)
        domain_id = raw.get("id")
        if not domain_id or not isinstance(domain_id, str):
            msg = f"Missing string 'id' in {path}"
            raise ValueError(msg)
        try:
            by_id[domain_id] = DomainConfigPayload.model_validate(raw)
        except ValidationError as e:
            msg = f"Invalid domain config {path}: {e}"
            raise ValueError(msg) from e

    if not by_id:
        msg = f"No domain configs loaded from {directory}"
        raise ValueError(msg)

    return DomainConfigStore(by_id=by_id)
