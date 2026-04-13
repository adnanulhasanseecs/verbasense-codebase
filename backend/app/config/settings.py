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
    database_url: str = Field(
        default="sqlite:///./verbasense.db",
        alias="DATABASE_URL",
        description="SQLAlchemy database URL for durable job persistence.",
    )
    job_worker_concurrency: int = Field(
        default=2,
        ge=1,
        alias="JOB_WORKER_CONCURRENCY",
        description="Number of in-process workers consuming queued jobs.",
    )
    job_max_retries: int = Field(
        default=2,
        ge=0,
        alias="JOB_MAX_RETRIES",
        description="Maximum retry attempts for a failed background job.",
    )
    job_retention_days: int = Field(
        default=14,
        ge=1,
        alias="JOB_RETENTION_DAYS",
        description="Retention window for terminal jobs before cleanup.",
    )
    retention_check_interval_seconds: int = Field(
        default=300,
        ge=30,
        alias="RETENTION_CHECK_INTERVAL_SECONDS",
        description="Minimum interval between retention cleanup passes.",
    )
    output_provider: str = Field(
        default="mock",
        alias="OUTPUT_PROVIDER",
        description="Output provider key (e.g. mock, openai, anthropic).",
    )
    output_model: str = Field(
        default="mock-v1",
        alias="OUTPUT_MODEL",
        description="Model identifier for selected output provider.",
    )
    output_fallback_providers: str = Field(
        default="",
        alias="OUTPUT_FALLBACK_PROVIDERS",
        description="Comma-separated provider keys used as deterministic fallback chain.",
    )
    output_provider_by_domain_json: str | None = Field(
        default=None,
        alias="OUTPUT_PROVIDER_BY_DOMAIN_JSON",
        description="Optional JSON map: domain_id -> provider key override.",
    )
    output_model_by_domain_json: str | None = Field(
        default=None,
        alias="OUTPUT_MODEL_BY_DOMAIN_JSON",
        description="Optional JSON map: domain_id -> model override.",
    )
    output_timeout_seconds: int = Field(
        default=30,
        ge=1,
        alias="OUTPUT_TIMEOUT_SECONDS",
        description="Timeout budget for provider calls.",
    )
    output_temperature: float = Field(
        default=0.2,
        ge=0.0,
        le=2.0,
        alias="OUTPUT_TEMPERATURE",
        description="Model temperature used by compatible providers.",
    )
    output_max_tokens: int = Field(
        default=2048,
        ge=1,
        alias="OUTPUT_MAX_TOKENS",
        description="Maximum generated tokens for compatible providers.",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
