"""Standard error response contract."""

from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    code: str
    message: str
    details: dict[str, Any] = Field(default_factory=dict)
    request_id: UUID
