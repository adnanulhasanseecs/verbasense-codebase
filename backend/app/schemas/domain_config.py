"""Pydantic models for domain YAML configuration."""

from typing import Any

from pydantic import BaseModel, Field


class UILabels(BaseModel):
    summary: str
    actions: str
    decisions: str


class UIConfig(BaseModel):
    name: str
    labels: UILabels


class PipelineConfig(BaseModel):
    stages: list[str]


class DomainConfigPayload(BaseModel):
    """Validated domain configuration (file + id)."""

    id: str = Field(..., description="API domain id, e.g. courtsense")
    domain: str = Field(..., description="Logical domain category, e.g. judicial")
    features: list[str]
    ui: UIConfig
    pipeline: PipelineConfig
    entities: list[str]

    def model_dump_public(self) -> dict[str, Any]:
        """Serialize for GET /config/domain/{id}."""
        return self.model_dump()
