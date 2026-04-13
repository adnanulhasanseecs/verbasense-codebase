# VerbaSense — CourtSense Phase A & B Progress

**Scope:** Contract-first backend, deterministic mock pipeline, demo-ready Next.js UI, domain config, tests, and minimal security.  
**Standard:** Production-ready structure and discipline (not a throwaway prototype).

Update this file as work completes. Prefer checking items only when verified (tests pass, behavior matches contract).

---

## Legend

- [ ] Not started / in progress  
- [x] Done and verified  

**Notes:** Use the **Decisions & specs** section to record agreed formats (upload metadata, domain IDs, failure hooks) so implementation stays consistent.

---

## 1. Repository & developer experience

- [x] Monorepo layout: `/backend`, `/frontend`, `/docs`, root `README.md`, `.env.example`
- [x] Root `README.md`: prerequisites, install, **one command** (or documented two-process flow) to run API + UI locally
- [x] `.env.example`: `NEXT_PUBLIC_API_URL` (frontend API base), backend `PORT`, `MOCK_DELAY`, `MOCK_FAILURE_RATE`, `CORS_ORIGINS` (see §8)
- [x] Document Python and Node version constraints (`README.md` + `docs/VERSIONS.md`; optional: add `engines` / `.python-version` in a follow-up)

### 1.1 Unit tests (repository & DX)

- [x] **CI workflow** — GitHub Actions (`.github/workflows/ci.yml`): backend ruff/black/mypy/pytest + frontend eslint/jest/build on push/PR to `main`/`master`
- [ ] **Env contract:** test that required env vars are documented and validated where applicable (fail fast with clear message)
- [x] *(If shared root utilities exist)* unit tests for any cross-package helpers — **N/A** (no shared root package yet)

---

## 2. API contracts (contract-first)

### 2.1 Base & versioning

- [x] All routes under `/api/v1/`
- [x] **OpenAPI** exposed by FastAPI (`/docs`, `/openapi.json`); committed `openapi.json` / codegen **not** added yet (optional follow-up)

### 2.2 Endpoints

- [x] `POST /api/v1/upload` — multipart, metadata + file (see §7 for field format)
- [x] `GET /api/v1/job/{id}` — job status, stage, progress, error when failed
- [x] `GET /api/v1/result/{id}` — result payload (see §7 for shape vs job)
- [x] `GET /api/v1/config/domain/{id}` — domain config for UI/pipeline labels
- [x] `GET /api/v1/health` — liveness/readiness for deploys and demos

### 2.3 Upload constraints

- [x] Multipart `file` (audio): accepted `.wav`, `.mp3`; max size configurable
- [x] **Domain** supported on upload — **form field** `domain` (default `courtsense`); documented in root `README.md`
- [x] Validation errors return **400** with standard error body (§2.5)

### 2.4 Job lifecycle

- [x] Status enum: `queued` | `processing` | `completed` | `failed`
- [x] Fields: `status`, `stage` (string), `progress` (0–100), `error` when `failed`
- [x] **Polling:** document 2–3s interval; stop on `completed` or `failed` (UI uses ~2.5s; README notes interval)

### 2.5 Error contract (mandatory)

Every error response:

```json
{
  "code": "string",
  "message": "string",
  "details": {},
  "request_id": "uuid"
}
```

- [x] Implemented globally (exception handlers)
- [x] Consistent HTTP status mapping (e.g. 400 validation, 404 unknown job, 413 payload too large, 500 internal)

### 2.6 IDs

- [x] Resource IDs use **UUID v4** everywhere (API paths, logs, `request_id`)

### 2.7 Unit tests (API routes, errors & IDs)

**Endpoints**

- [x] **`POST /upload`:** success (**201**), rejects bad file type — **covered** (`test_upload_and_job.py`)
- [x] **`POST /upload`:** rejects oversize file (**413**), invalid metadata (**400**) — **covered** (`test_api_contract_errors.py`)
- [x] **`GET /job/{id}`:** **404** unknown id — **covered** (`test_api_contract_errors.py`)
- [x] **`GET /job/{id}`:** returns job shape; polling until `completed` — **covered**
- [x] **`GET /result/{id}`:** returns `OutputSchema` when complete — **covered**; aligns with §7
- [x] **`GET /result/{id}`:** **404** not ready, **409** when job **failed** — **covered** (`test_api_contract_errors.py`)
- [x] **`GET /config/domain/{id}`:** returns config; **404** unknown domain — **covered**
- [x] **`GET /health`:** returns 200 — **covered**
- [ ] **OpenAPI:** snapshot or schema test — **not added** (optional)

**Error contract & IDs**

- [x] Error responses for exercised paths match **§2.5** shape (e.g. unknown domain) — **partial coverage**
- [ ] Full matrix: every error path + **`request_id`** UUID assertions — **partial** (spot-check + key paths in `test_api_contract_errors.py`)
- [x] Invalid UUID path params — **422** + error envelope — **covered** (`test_api_contract_errors.py`)

---

## 3. Domain configuration

- [x] File: `/backend/config/domains/courtsense.yaml` matching agreed schema
- [x] **Pydantic** validation at startup; fail fast on invalid config
- [x] **Single notion of domain id:** API id `courtsense` (`id` in YAML); logical `domain: judicial`; upload uses form field `domain=courtsense` (see §7)
- [ ] `features` list drives behavior: hide/disable routes or return 404 for unsupported features — **not wired** (no optional doc-intelligence route in MVP)

### 3.1 Unit tests (domain configuration)

- [x] Loader parses `courtsense.yaml` — **covered** via API config test + app startup
- [ ] Invalid YAML / missing required keys → startup failure — **no automated test**
- [x] Unknown `domain` id → **404** on `GET /config/domain/{id}` — **covered**
- [ ] `features` list enforced per feature branch — **pending** (no feature-gated routes yet)

---

## 4. Schemas & mock pipeline

### 4.1 Pydantic models (backend)

- [x] `TranscriptSegment` — `speaker`, `text`, optional `start_ms`, `end_ms`
- [x] `ActionItem`, `Entity`, `OutputSchema` with `key_decisions`, `schema_version` default `v1`

### 4.2 Mock pipeline (`/core/pipeline.py` or equivalent)

- [x] **Deterministic** output derived from `job_id` (hash)
- [x] **Config-driven** stages/labels aligned with domain YAML
- [x] **Latency** controlled via env (`MOCK_DELAY`)
- [x] **Failure mode:** `MOCK_FAILURE_RATE` + header `X-Mock-Failure` (documented in `README.md`); E2E uses fast `MOCK_DELAY=0`

### 4.3 Storage

- [x] Job store: **in-memory** (`JobService`); **SQLite** not used — document in `README.md` / §7 if needed for stakeholders

### 4.4 Unit tests (schemas & pipeline)

- [ ] **Pydantic:** full round-trip / invalid payload rejection — **partial** (integration exercises output)
- [x] **Pipeline:** same `job_id` → identical mock output — **covered** (`test_pipeline.py`)
- [x] **Pipeline:** domain config drives **stage list** in job runner — **implemented** (timing tested with `MOCK_DELAY=0`)
- [ ] **Pipeline:** failure mode automated test — **pending**
- [ ] **Storage:** isolated store unit tests — **pending**

---

## 5. Security & operations (minimal)

- [x] CORS configured for dev (`CORS_ORIGINS` in settings)
- [x] File size limits enforced server-side (`max_upload_bytes`)
- [x] No secrets in repo; configuration via env / defaults
- [x] Structured logging with `job_id` in log `extra` (no raw audio bytes in messages)
- [x] *(Optional)* Rate limiting — **out of scope** for Phase A (noted here)

### 5.1 Unit tests (security & operations)

- [ ] **CORS** automated test — **pending**
- [ ] **Upload limit** (**413** + error contract) — **pending**
- [ ] **Logging** `job_id` assertion — **pending**

---

## 6. Frontend (Next.js App Router)

### 6.1 Stack & quality

- [x] TypeScript, Tailwind CSS
- [x] ESLint + Prettier (`eslint-config-prettier`, `format` script)
- [x] Central API client (`/lib/api.ts`) + **typed** interfaces aligned with backend

#### 6.1.1 Unit tests (API client & types)

- [ ] **API client** mocked `fetch` tests — **pending**
- [x] **Types:** TypeScript strict + `next build` — compile-time alignment with API

### 6.2 Routes

- [x] `/` — Dashboard
- [x] `/upload` — upload + metadata
- [x] `/jobs/[id]` — processing + transcript + intelligence panel
- [x] `/export/[id]` — export actions

#### 6.2.1 Unit tests (routing & layout)

- [ ] Root layout / per-route smoke — **partial** (Playwright hits `/` and `/upload`; no RTL route tests)

### 6.3 Behavior

- [x] **Job id in URL** for deep links and refresh
- [x] Polling `GET /job/{id}` (~2.5s); stops when `completed` / `failed`
- [x] **Result pattern:** `GET /result/{id}` after `completed` (not embedded in job response)

#### 6.3.1 Unit tests (hooks / job state)

- [ ] Polling with fake timers — **pending**
- [x] **Error path:** job/export surfaces errors in UI — **manual / E2E smoke level**

### 6.4 Screens (mandatory flow)

- [x] Dashboard — recent jobs (localStorage), upload CTA, status badges
- [x] Upload — drag/drop, `case_id` / `courtroom`, submit → job page
- [x] Processing — pipeline stages from config + progress bar
- [x] Transcript + intelligence — segments, timestamps, summary, decisions, actions
- [x] Export — `.txt` transcript/summary, `.json` report

#### 6.4.1 Unit tests (screens & components)

- [x] **StatusBadge** — **covered** (`tests/StatusBadge.test.tsx`)
- [ ] Remaining screens — **pending** (RTL); **E2E smoke** covers dashboard + upload load

### 6.5 Design system (VerbaSense / CourtSense)

- [x] Colors: background `#0B0F19`, surface `#121826`, accents `#3B82F6` / `#6366F1`, highlight `#22D3EE`, text `#E5E7EB` / `#9CA3AF`
- [x] Branding: `AppShell` mark + metadata title **CourtSense · VerbaSense**; favicon via Next.js **`app/icon.png`**, **`app/apple-icon.png`**, **`app/favicon.ico`** (VerbaSense shield logo; square canvas for `.ico`); reusable asset copy at **`public/images/brand/verbasense-logo.png`**. Legacy **`public/favicon.svg`** may remain unused by the App Router metadata pipeline.
- [x] `:focus-visible` outline in globals; keyboard-accessible upload control — **spot-check recommended** for full WCAG audit

#### 6.5.1 Unit tests (design system primitives)

- [ ] Dedicated **Card** / **Button** primitives — **using composable Tailwind + `AppShell`**; variant tests **pending**
- [ ] **a11y** automated assertions — **pending**

---

## 7. Decisions & specs (fill during implementation)

Record answers here so backend, frontend, and tests stay aligned.

| Topic | Decision |
|--------|----------|
| Upload `metadata` format | Multipart form field `metadata`: JSON string with optional `case_id`, `courtroom` (see `UploadMetadata` / `lib/api.ts`) |
| Domain on upload | **Form field** `domain` (default `courtsense`) |
| Domain id for API (`courtsense` vs `judicial`) | **API / upload id:** `courtsense` (`id` in YAML). **Logical category:** `judicial` in YAML `domain:` for future multi-domain |
| `GET /job/{id}` vs `GET /result/{id}` | **Job:** status/progress only. **Result:** separate `GET /result/{id}` after `completed`; **404** if not ready, **409** if `failed` |
| Mock failure trigger | `MOCK_FAILURE_RATE` (env) + header **`X-Mock-Failure: 1`** |
| Job persistence | **In-memory** (`JobService`); restart clears jobs |

---

## 8. Testing (integration & E2E rollup)

*Unit-test checklists live next to each section (§1–§6). This section covers cross-cutting and non-unit tests.*

### 8.1 Backend — integration (pytest)

- [x] **TestClient** exercises upload → poll → result (`test_upload_and_job.py`)
- [x] **Status transition** to `completed` with async mock pipeline (`MOCK_DELAY=0` in tests)
- [x] **Error contract** on every status code — **partial** (§2.7 gaps closed for 400/404/409/413/422; OpenAPI snapshot still optional)

### 8.2 Frontend — integration (RTL)

- [ ] **Upload → job** RTL/MSW flow — **pending**

### 8.3 E2E (Playwright)

- [ ] **Full demo path** (upload → job → export) — **not automated**; smoke tests only (`e2e/smoke.spec.ts`: dashboard + upload page load)
- [x] **Base URL** `http://localhost:3011` (Playwright `baseURL`, overridable via `PLAYWRIGHT_BASE_URL`); document: run `npm run dev` before `npm run test:e2e` (see `README.md`)
- [x] Deterministic mock in tests via **`MOCK_DELAY=0`**

### 8.4 Quality gates

- [x] Ruff, Black, MyPy passing on backend
- [x] ESLint, `next build` (includes TypeScript check) on frontend; Prettier available via `npm run format`

---

## 9. Future compatibility (non-blocking checklist)

- [x] No hardcoded judicial business rules — mock content is generic; labels/stages from domain config
- [x] Stable **OutputSchema** / API paths for later AI swap
- [x] **Domain** parameter on upload + config endpoint for additional domains later
- [x] Stack is self-hostable (FastAPI + Next.js); no required cloud AI in core path

### 9.1 Unit tests (future-proofing guards)

- [ ] Second domain YAML + tests — **pending**
- [ ] **No stray literals** guard — **pending**

---

## 10. Final verification (before “done”)

- [x] `docs/progress.md` updated to reflect current implementation (latest: 2026-04-11)
- [ ] **All §1–§9 unit-test subsections** — **gaps remain** (see unchecked items above); N/A noted where applicable
- [x] README run instructions verified on dev machine (best effort)
- [ ] Error handling manually smoke-tested (400, 404, failure job) — **recommended before release demo**
- [ ] Accessibility spot-check on core screens — **recommended**

---

## Quick reference — prompt objectives

1. Complete API contracts (requests, responses, errors)  
2. Deterministic mock pipeline  
3. Demo-ready frontend (full flow)  
4. Domain configuration (CourtSense)  
5. VerbaSense design system  
6. Unit tests + basic E2E  
7. Future: multi-domain, AI, on-prem  

---

*Last updated: 2026-04-11 — CI workflow + `test_api_contract_errors.py` (§2.7 gaps); favicon/branding notes and Playwright `3011` in prior edit.*
