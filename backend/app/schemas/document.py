"""Schemas for document processing via LLM."""

from __future__ import annotations

from pydantic import BaseModel


class DocumentEntities(BaseModel):
    case_id: str
    judge: str
    parties: list[str]
    evidence: list[str]
    dates: list[str]


class DocumentProcessResponse(BaseModel):
    summary: str
    key_points: list[str]
    referenced_sections: list[str]
    entities: DocumentEntities
    provider: str
    model: str
    prompt_used: str


class LlmKeyValidationRequest(BaseModel):
    provider: str
    base_url: str
    api_key: str


class LlmKeyValidationResponse(BaseModel):
    valid: bool
    provider: str
    base_url: str
    message: str
