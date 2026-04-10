"""Upload metadata validation."""

from pydantic import BaseModel


class UploadMetadata(BaseModel):
    case_id: str | None = None
    courtroom: str | None = None

    @classmethod
    def parse_json(cls, raw: str | None) -> "UploadMetadata":
        if raw is None or raw.strip() == "":
            return cls()
        import json

        try:
            data = json.loads(raw)
        except json.JSONDecodeError as e:
            msg = "metadata must be valid JSON"
            raise ValueError(msg) from e
        if not isinstance(data, dict):
            msg = "metadata JSON must be an object"
            raise ValueError(msg)
        return cls.model_validate(data)
