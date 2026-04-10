"""Pipeline output models (contract-stable)."""

from pydantic import BaseModel


class TranscriptSegment(BaseModel):
    speaker: str
    text: str
    start_ms: int | None = None
    end_ms: int | None = None


class ActionItem(BaseModel):
    text: str
    owner: str | None = None
    priority: str | None = None


class Entity(BaseModel):
    type: str
    value: str


class OutputSchema(BaseModel):
    transcript: list[TranscriptSegment]
    summary: str
    key_decisions: list[str]
    actions: list[ActionItem]
    entities: list[Entity]
    schema_version: str = "v1"


class ResultEnvelope(BaseModel):
    """GET /result/{id} body."""

    job_id: str
    domain: str
    output: OutputSchema
