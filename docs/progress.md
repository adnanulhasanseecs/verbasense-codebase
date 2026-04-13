# VerbaSense — CourtSense Phase A, B & C Progress

**Scope:** Contract-first backend, deterministic mock pipeline, demo-ready Next.js UI, domain config, tests, and minimal security.  
**Standard:** Production-ready structure and discipline (not a throwaway prototype).

Update this file as work completes. Prefer checking items only when verified (tests pass, behavior matches contract).

---

## Legend

- [ ] Not started / in progress  
- [x] Done and verified  

**Notes:** Use the **Decisions & specs** section to record agreed formats (upload metadata, domain IDs, failure hooks) so implementation stays consistent.

---

## Status snapshot

### A/B sections (current state)

| Section | Status | Owner | Target date | Blockers / notes |
|--------|--------|-------|-------------|------------------|
| 1. Repository & DX | 🟡 Mostly done | `TBD` | `TBD` | Env contract test still open (§1.1) |
| 2. API contracts | 🟡 Mostly done | `TBD` | `TBD` | OpenAPI snapshot + full error matrix still open (§2.7) |
| 3. Domain configuration | 🟡 In progress | `TBD` | `TBD` | Feature gating and invalid YAML tests pending (§3.1) |
| 4. Schemas & mock pipeline | 🟡 In progress | `TBD` | `TBD` | Failure-mode + storage unit tests pending (§4.4) |
| 5. Security & operations | 🟡 In progress | `TBD` | `TBD` | CORS/logging/413 tests pending (§5.1) |
| 6. Frontend app router | 🟡 In progress | `TBD` | `TBD` | API client/polling/RTL/a11y tests pending (§6.x) |
| 7. Decisions & specs | 🟢 Stable baseline | `TBD` | `TBD` | Update as new AI/auth decisions are finalized |
| 8. Integration & E2E | 🟡 In progress | `TBD` | `TBD` | Full upload→job→export E2E still pending (§8.3) |
| 9. Future compatibility | 🟡 In progress | `TBD` | `TBD` | Second domain + stray literal guard pending (§9.1) |
| 10. Final verification | 🟡 In progress | `TBD` | `TBD` | Manual error smoke + accessibility pass pending |

### Phase C tracks (planned / execution)

| Track | Status | Owner | Target date | Blockers / notes |
|------|--------|-------|-------------|------------------|
| 11.1 C1 Persistence & async infra | 🟡 In progress | `TBD` | `TBD` | DB + migrations + in-process queue/retry + idempotency + retention landed; external worker/DLQ hardening still follow-up |
| 11.2 C2 AI provider abstraction | 🟡 In progress | `TBD` | `TBD` | Interface + factory + config routing + fallback + validation + telemetry tests landed; real external adapters still pending |
| 11.3 C3 Auth & authorization | ⚪ Planned | `TBD` | `TBD` | Can start in parallel with agreed user/account model |
| 11.4 C4 Admin console | ⚪ Planned | `TBD` | `TBD` | Can start UI in parallel; backend policy hooks required |
| 11.5 C5 Security hardening | ⚪ Planned | `TBD` | `TBD` | Needs auth + provider secrets decisions |
| 11.6 C6 Eval/rollout gates | ⚪ Planned | `TBD` | `TBD` | Needs provider outputs and telemetry from C2/C1 |

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

## 11. Phase C — productionization plan (AI + auth + admin)

**Goal:** Move from deterministic mock pipeline to production-ready multi-provider AI flows with real authentication, account management, and secure operations.

### 11.1 C1 — Persistence & async job infrastructure (**start here**)

- [x] Introduce durable job persistence (DB-backed `JobService`) for jobs/results/status history; in-memory singleton replaced as source of truth for job state
- [x] Add migration tooling + baseline schema foundation (`alembic`, `alembic.ini`, baseline revision for `jobs` + `job_events`; broader auth/account tables still pending)
- [x] Add async worker/queue for long-running AI tasks (in-process queue workers + retries/backoff + retry-exhausted terminal failure state)
- [x] Add idempotent job creation and replay-safe processing semantics (`X-Idempotency-Key` reuse returns existing job)
- [x] Define retention/cleanup policy for uploads, intermediate artifacts, and results (terminal job cleanup via configurable retention window)

**C1 plain-English summary (what was implemented and why it matters):**
- [x] We moved job tracking from temporary memory to a real database-backed store, so job status does **not** disappear when service internals reset.
- [x] We now keep a `job_events` history (created/updated snapshots), which helps debugging and later audit/reporting.
- [x] Migration tooling (Alembic) is set up, so schema changes can be versioned and applied consistently across environments.
- [x] Jobs now go through worker queues with retry logic, so transient processing failures can recover automatically.
- [x] Repeated uploads with the same idempotency key no longer create duplicate jobs, which prevents accidental double-processing.
- [x] Old terminal jobs can be purged based on retention settings, helping keep storage predictable.

#### 11.1.1 Unit/integration tests (C1)

- [x] Repository-level tests for `jobs` CRUD and event history (`tests/test_job_repository.py`)
- [x] Queue/worker behavior covered at service/API level for normal completion and retry-safe lifecycle; dedicated poison-job stress suite still recommended follow-up
- [x] Integration test: upload → persisted job → completed/failed result with DB-backed reads (existing API tests pass with DB-backed service)
- [x] Migration smoke in CI (fresh DB + upgrade + rollback sanity) — added to `.github/workflows/ci.yml` backend job

### 11.2 C2 — AI provider abstraction & model routing

- [x] Introduce provider interfaces for structured output generation (`OutputProvider` protocol + factory wiring; baseline for `summary`/`entities`/`action_items` in current `OutputSchema`)
- [x] Implement initial provider adapter behind config flags (mock adapter selected via `OUTPUT_PROVIDER=mock`)
- [x] Add model registry/config (`provider`, `model`, `temperature`, `max_tokens`, `timeout`) scoped by domain/flow baseline (`OUTPUT_*` settings + domain override maps; account scoping pending auth model)
- [x] Add deterministic fallback policy across providers/models for resilience (primary + ordered fallback chain)
- [x] Validate and normalize model outputs into stable `OutputSchema` (provider contract returns `OutputSchema`; API contract unchanged)

**C2 plain-English summary (start of integration phase):**
- [x] The backend can now choose a model provider through a common interface, instead of hard-coding pipeline output generation.
- [x] Today it still uses the deterministic mock provider by default, but the architecture is now ready to plug real providers one-by-one.
- [x] This reduces future rework: swapping providers can happen in one place without changing API endpoints.

#### 11.2.1 Unit/integration tests (C2)

- [x] Adapter contract tests with mocked provider behaviors (`mock`, `failing`, `invalid`) via `tests/test_provider_factory.py`
- [x] Output-schema validation tests for malformed/partial model payloads (invalid payload falls back or fails with clear error)
- [x] Routing tests for domain-level model/provider selection and fallback behavior (`OUTPUT_PROVIDER_BY_DOMAIN_JSON`, fallback chain)
- [x] Cost/latency telemetry tests (token usage/latency/provider/model captured in job events; see `test_completed_job_records_provider_telemetry`)

### 11.3 C3 — Real authentication & authorization

- [ ] Select and implement auth strategy (OIDC/Auth.js/custom JWT) with secure session handling
- [ ] Add backend auth middleware and policy enforcement on protected API routes
- [ ] Implement roles/permissions for core personas (`admin`, `operator`, `reviewer`, `viewer`)
- [ ] Add invite/onboarding flow and account membership lifecycle
- [ ] Add audit trail for auth-sensitive events (login, invite, role change, deactivation)

#### 11.3.1 Unit/integration tests (C3)

- [ ] Auth middleware tests (unauthenticated → 401, unauthorized → 403, permitted → 2xx)
- [ ] RBAC matrix tests for protected endpoints and sensitive actions
- [ ] Session tests (expiration, refresh/rotation, logout invalidation)
- [ ] Invite acceptance and membership edge-case tests

### 11.4 C4 — Admin console (real users + account/model setup)

- [ ] Build admin pages for user list, invite user, role assignment, deactivate/reactivate user
- [ ] Build account settings for AI provider credentials and per-flow model mapping
- [ ] Build audit log viewer with filtering (actor, action, time, account)
- [ ] Add safeguards for high-risk actions (confirmation + privileged role checks)
- [ ] Add UX states for empty/loading/error and admin route-level protection

#### 11.4.1 Unit/E2E tests (C4)

- [ ] RTL tests for admin forms/validation, role changes, and guarded actions
- [ ] Playwright E2E for admin happy path (invite → role assign → restricted page access)
- [ ] Negative E2E (non-admin blocked from admin pages and admin APIs)
- [ ] Accessibility checks for admin critical flows (keyboard/focus/form errors)

### 11.5 C5 — Security hardening & compliance basics

- [ ] Move provider credentials to a secrets manager strategy (no plaintext secrets in DB/logs)
- [ ] Add PII handling/redaction policy for prompts, logs, and exports
- [ ] Add request throttling/rate limits for auth/admin and high-cost AI endpoints
- [ ] Add incident-ready observability (structured logs, metrics, alerts, trace correlation)
- [ ] Add backup/restore and disaster-recovery runbook for persistence layer

#### 11.5.1 Tests/verification (C5)

- [ ] Security regression tests for protected routes and key management boundaries
- [ ] Log-scrubbing checks (no secret/token/PII leakage in standard logs)
- [ ] Load/perf baseline for queue throughput and p95 latency by stage
- [ ] Manual security checklist pass before enabling production keys

### 11.6 C6 — Evaluation, rollout controls, and release gates

- [ ] Build golden evaluation set for each AI flow (transcript quality, summary fidelity, action extraction)
- [ ] Define rollout strategy (account-level flags, canary, fallback on provider outage)
- [ ] Add quality/cost SLOs and dashboard for acceptance gates
- [ ] Add release checklist tied to CI, manual QA, and eval pass criteria

#### 11.6.1 Tests/verification (C6)

- [ ] Automated eval pipeline on candidate model/prompt changes
- [ ] Regression delta reports with acceptance thresholds
- [ ] Rollback drill (switch model/provider and restore previous stable config)

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

*Last updated: 2026-04-13 — C1 migration smoke wired in CI; C2 advanced with provider registry/config (`OUTPUT_*`), domain overrides, deterministic fallback chain, routing/validation tests, and telemetry assertions.*
