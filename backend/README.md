# VerbaSense backend

Run from this directory so `config/domains/*.yaml` resolves correctly.

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Configuration

| Variable | Purpose |
|----------|---------|
| `PORT` | Uvicorn bind (use CLI flag or `Settings.port`) |
| `MOCK_DELAY` | Per-stage delay in ms (default 400) |
| `MOCK_FAILURE_RATE` | 0–1 probability bucket for simulated failures |
| `CORS_ORIGINS` | Comma-separated allowed origins |

Domain configs live in `config/domains/` (see `courtsense.yaml`).
