# VerbaSense backend

Run from this directory so `config/domains/*.yaml` resolves correctly.

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Configuration

| Variable | Purpose |
|----------|---------|
| `PORT` | Uvicorn bind (use CLI flag or `Settings.port`) |
| `DATABASE_URL` | SQLAlchemy URL for durable job persistence (default `sqlite:///./verbasense.db`) |
| `JOB_WORKER_CONCURRENCY` | Number of in-process job workers (default `2`) |
| `JOB_MAX_RETRIES` | Max retry attempts for transient worker failures (default `2`) |
| `JOB_RETENTION_DAYS` | Retention window for terminal jobs before cleanup (default `14`) |
| `RETENTION_CHECK_INTERVAL_SECONDS` | Minimum interval between retention cleanup passes (default `300`) |
| `OUTPUT_PROVIDER` | Output provider key (`mock` default; pluggable for C2) |
| `OUTPUT_MODEL` | Model identifier label for selected provider (default `mock-v1`) |
| `OUTPUT_FALLBACK_PROVIDERS` | Comma-separated fallback chain (e.g. `mock`) |
| `OUTPUT_PROVIDER_BY_DOMAIN_JSON` | Optional JSON map of domain-specific provider overrides |
| `OUTPUT_MODEL_BY_DOMAIN_JSON` | Optional JSON map of domain-specific model overrides |
| `OUTPUT_TIMEOUT_SECONDS` | Provider timeout budget (default `30`) |
| `OUTPUT_TEMPERATURE` | Provider temperature hint (default `0.2`) |
| `OUTPUT_MAX_TOKENS` | Provider token cap hint (default `2048`) |
| `MOCK_DELAY` | Per-stage delay in ms (default 400) |
| `MOCK_FAILURE_RATE` | 0–1 probability bucket for simulated failures |
| `CORS_ORIGINS` | Comma-separated allowed origins |

Domain configs live in `config/domains/` (see `courtsense.yaml`).

## Migrations (Alembic)

Run from `backend/`:

```powershell
alembic upgrade head
```

Create a new revision after model changes:

```powershell
alembic revision -m "describe change"
```

## Idempotent upload support

`POST /api/v1/upload` accepts optional `X-Idempotency-Key`.  
When repeated with the same key, API returns the existing job instead of creating duplicates.
