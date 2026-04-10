"""Application settings loaded from environment variables."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration (no secrets required for mock phase)."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    api_host: str = "0.0.0.0"
    port: int = 8011
    cors_origins: str = Field(
        default="http://localhost:3011",
        description="Comma-separated list of allowed CORS origins",
    )
    max_upload_bytes: int = 50 * 1024 * 1024  # 50 MB
    mock_delay_ms: int = Field(default=400, alias="MOCK_DELAY")
    mock_failure_rate: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        alias="MOCK_FAILURE_RATE",
        description="Probability [0,1] that a job fails (deterministic overlay uses job id).",
    )
    domains_config_dir: str = Field(
        default="config/domains",
        description="Directory containing domain YAML files (relative to backend project root).",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
