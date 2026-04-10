# VerbaSense — CourtSense (Phase A & B)

Contract-first FastAPI backend with a deterministic mock pipeline and a Next.js (App Router) demo UI.

## Default ports

| Service  | Port | URL |
|----------|------|-----|
| **Frontend** | **3011** | http://localhost:3011 |
| **Backend API** | **8011** | http://localhost:8011 · OpenAPI: http://localhost:8011/docs |

These avoid conflicts with common dev ports (3000/8000). Override via env if needed.

## Prerequisites

- **Python** 3.11+ (3.13 verified locally)
- **Node.js** 20+ (for Next.js 16)

## Manage script (start / stop / status / restart)

From the repo root (Windows PowerShell):

```powershell
.\scripts\manage.ps1 status
.\scripts\manage.ps1 start
.\scripts\manage.ps1 stop
.\scripts\manage.ps1 restart
```

Or: `scripts\manage.cmd start`

- Writes `backend/.env` and `frontend/.env.local` **on first run** (or use `-InitializeEnv` to rewrite) with `CORS_ORIGINS` / `NEXT_PUBLIC_API_URL` matching the ports above.
- Stores PIDs under `.run/` and logs under `.run/backend.log`, `.run/frontend.log`.

**Linux / macOS:** `chmod +x scripts/manage.sh && ./scripts/manage.sh start`

**Manual (two terminals)** — after `pip install -e ".[dev]"` in `backend/` and `npm install` in `frontend/`:

```powershell
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8011
```

```powershell
cd frontend
npm run dev
```

Ensure `frontend/.env.local` contains `NEXT_PUBLIC_API_URL=http://localhost:8011` and `backend/.env` has `CORS_ORIGINS=http://localhost:3011`. Copy from `.env.example` if needed.

## Verified dependency versions

See `docs/VERSIONS.md` (checked against npm/PyPI as of April 2026; re-pin for production releases).

## Scripts

| Area | Command |
|------|---------|
| Backend tests | `cd backend && pytest` |
| Backend lint | `cd backend && ruff check app tests && black --check app tests && mypy app` |
| Frontend build | `cd frontend && npm run build` |
| Frontend tests | `cd frontend && npm test` |
| E2E (dev server on 3011) | `cd frontend && npm run test:e2e` |

## API contract

- Base path: `/api/v1`
- Upload: `POST /api/v1/upload` (multipart: `file`, optional `metadata` JSON string, `domain` default `courtsense`)
- Mock failure header: `X-Mock-Failure: 1`

## Project layout

- `backend/` — FastAPI, domain YAML, mock pipeline, pytest
- `frontend/` — Next.js UI, RTL/Jest, Playwright smoke
- `docs/` — progress checklist and version pins
- `scripts/` — `manage.ps1`, `manage.cmd`, `manage.sh`
