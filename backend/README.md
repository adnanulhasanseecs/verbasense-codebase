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
| `SECRET_ENCRYPTION_KEY` | Fernet key for encrypting provider credentials at rest in account config |
| `RATE_LIMIT_WINDOW_SECONDS` | Fixed-window duration for API throttling (default `60`) |
| `RATE_LIMIT_AUTH_PER_WINDOW` | Max auth requests/client/window (default `120`) |
| `RATE_LIMIT_ADMIN_PER_WINDOW` | Max admin requests/client/window (default `60`) |
| `RATE_LIMIT_AI_PER_WINDOW` | Max AI-heavy requests/client/window (default `30`) |
| `OBSERVABILITY_METRICS_ENABLED` | Enable in-process metrics tracking for `/api/v1/ops/metrics` |
| `EVAL_MODE_ENABLED` | Enable evaluation tooling mode in non-production environments |
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

## Ops endpoints

- `GET /api/v1/ops/metrics` (admin): request counters + AI latency p95 snapshot for SLO monitoring

## C5/C6 runbooks and eval assets

- Backup/restore + DR runbook: `docs/ops/backup-restore-runbook.md`
- Release checklist: `docs/ops/release-checklist.md`
- Golden evaluation set: `docs/evals/golden_document_eval.jsonl`
- Golden eval script: `backend/scripts/eval_document_golden.py`
