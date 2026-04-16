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
    output_base_url: str = Field(
        default="https://api.openai.com/v1",
        alias="OUTPUT_BASE_URL",
        description="Base URL for OpenAI-compatible transcription-intelligence model calls.",
    )
    output_api_key: str = Field(
        default="",
        alias="OUTPUT_API_KEY",
        description="API key for transcription-intelligence provider calls.",
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
    asr_provider: str = Field(
        default="mock",
        alias="ASR_PROVIDER",
        description="ASR provider key (mock, openai, self-hosted-whisper).",
    )
    asr_model: str = Field(
        default="whisper-1",
        alias="ASR_MODEL",
        description="ASR model ID (e.g. whisper-1 or whisper-large-v3).",
    )
    asr_base_url: str = Field(
        default="https://api.openai.com/v1",
        alias="ASR_BASE_URL",
        description="ASR API base URL for OpenAI-compatible transcription endpoint.",
    )
    asr_api_key: str = Field(
        default="",
        alias="ASR_API_KEY",
        description="ASR API key/token for cloud or self-hosted gateway.",
    )
    asr_timeout_seconds: int = Field(
        default=45,
        ge=1,
        alias="ASR_TIMEOUT_SECONDS",
        description="Timeout for ASR transcription requests.",
    )
    transcription_intelligence_model: str = Field(
        default="mock-v1",
        alias="TRANSCRIPTION_INTELLIGENCE_MODEL",
        description="Model ID used to generate summary/actions/entities from ASR transcript.",
    )
    strict_real_providers: bool = Field(
        default=False,
        alias="STRICT_REAL_PROVIDERS",
        description="Disable mock/demo providers for document processing when enabled.",
    )
    secret_encryption_key: str = Field(
        default="",
        alias="SECRET_ENCRYPTION_KEY",
        description="Fernet key for encrypting stored provider credentials at rest.",
    )
    rate_limit_window_seconds: int = Field(
        default=60,
        ge=1,
        alias="RATE_LIMIT_WINDOW_SECONDS",
        description="Window size for in-memory API rate limits.",
    )
    rate_limit_auth_per_window: int = Field(
        default=120,
        ge=1,
        alias="RATE_LIMIT_AUTH_PER_WINDOW",
        description="Max auth requests per client per window.",
    )
    rate_limit_admin_per_window: int = Field(
        default=60,
        ge=1,
        alias="RATE_LIMIT_ADMIN_PER_WINDOW",
        description="Max admin requests per client per window.",
    )
    rate_limit_ai_per_window: int = Field(
        default=30,
        ge=1,
        alias="RATE_LIMIT_AI_PER_WINDOW",
        description="Max high-cost AI requests per client per window.",
    )
    observability_metrics_enabled: bool = Field(
        default=True,
        alias="OBSERVABILITY_METRICS_ENABLED",
        description="Enable lightweight in-process metrics collection.",
    )
    eval_mode_enabled: bool = Field(
        default=False,
        alias="EVAL_MODE_ENABLED",
        description="Enable evaluation endpoints and golden-set tooling in non-prod.",
    )
    audio_artifacts_dir: str = Field(
        default="artifacts/audio",
        alias="AUDIO_ARTIFACTS_DIR",
        description="Directory for persisted raw audio artifacts (upload/live).",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
