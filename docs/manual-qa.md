# Manual QA — VerbaSense / CourtSense

Use this checklist before a release demo or after large UI/API changes. It complements automated tests (pytest, Jest, CI) and does **not** require a production database or external AI services—only local backend + frontend with the mock pipeline.

**Related:** `docs/progress.md` §10 (final verification), root `README.md` (ports and env).

---

## Prerequisites

1. Backend and frontend running locally (see root `README.md`).
   - **API:** http://localhost:8011 — OpenAPI: http://localhost:8011/docs  
   - **UI:** http://localhost:3011  
2. `frontend/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8011`  
3. `backend/.env`: `CORS_ORIGINS` includes `http://localhost:3011` (or use `scripts/manage.ps1` / `manage.sh` to align env).

Optional: browser **DevTools → Network** filtered by `8011` or `api` to inspect requests and response bodies.

---

## 1. Error-handling smoke (API contract §2.5)

Every error JSON should include `code`, `message`, `details`, and `request_id` (UUID). Confirm status codes match expectations.

### 1.1 `400` — validation / bad input

| Check | How | Expect |
|--------|-----|--------|
| Bad file type | `POST /api/v1/upload` with a non-audio file (e.g. `.txt`) | **400**, `code` e.g. `invalid_file_type` |
| Invalid `metadata` | Same upload with form field `metadata` set to invalid JSON (e.g. `{not-json`) | **400**, `code` `invalid_metadata` |
| Unknown domain | `POST /api/v1/upload` with `domain=not-a-real-domain` | **400**, `code` `unknown_domain` |

You can use **Swagger UI** (`/docs`), **curl**, or the app’s Upload screen where applicable.

### 1.2 `404` — missing resource

| Check | How | Expect |
|--------|-----|--------|
| Unknown job | `GET /api/v1/job/{random-uuid-v4}` | **404** |
| Unknown domain config | `GET /api/v1/config/domain/does-not-exist` | **404** |
| Result not ready | Start an upload, then `GET /api/v1/result/{job_id}` **before** the job completes (may need a short window if mock delay is 0) | **404**, message/body indicates not ready |
| Unknown job for result | `GET /api/v1/result/{random-uuid-v4}` | **404** |

### 1.3 `413` — payload too large

Temporarily set a small limit in `backend/.env` (e.g. `MAX_UPLOAD_BYTES=100`), restart the API, upload a `.wav` larger than the limit, then restore the previous value. Expect **413** and `code` `payload_too_large`.

### 1.4 `409` — result when job failed

Trigger a failed job (e.g. upload with header `X-Mock-Failure: 1`, or high `MOCK_FAILURE_RATE` in env). When `GET /api/v1/job/{id}` shows `status: failed`, call `GET /api/v1/result/{id}`. Expect **409** and a body consistent with “job failed” (see §7 in `progress.md`).

### 1.5 `422` — invalid path UUID

`GET /api/v1/job/not-a-uuid` and `GET /api/v1/result/not-a-uuid`. Expect **422** and the standard error envelope (`validation_error`).

### 1.6 UI parity (optional)

On screens that surface errors (upload, job, export), confirm the user sees a clear message (not a blank screen) when the API returns **4xx/5xx**. No need to match API `code` strings verbatim if the UX copy is intentional.

**Record:** note any status code or body shape that disagrees with OpenAPI or `docs/progress.md` §7.

---

## 2. Accessibility spot-check (core screens)

Goal: keyboard-only sanity pass and visible focus—not a full WCAG audit.

**Setup:** Prefer keyboard only (Tab / Shift+Tab / Enter / Space). Check **Dashboard**, **Upload**, **Job / processing**, **Export** (or the routes your build exposes).

| # | Check |
|---|--------|
| 1 | **Tab order** is logical; no traps (you can always Tab away). |
| 2 | **Focus visible** on interactive elements (`:focus-visible` / outline). |
| 3 | **Buttons and links** have an accessible name (visible text or `aria-label`). |
| 4 | **Form fields** have labels; errors are not conveyed by color alone. |
| 5 | **Dialogs / drawers** (if any): dismissible, focus manageable. |

**Optional tools:** Lighthouse “Accessibility” on 1–2 URLs; axe DevTools for hints (still perform a short manual pass).

**Record:** list blockers vs nice-to-fix, with page URL.

---

## 3. Session log (template)

| Date | Tester | Build / commit | API errors §1 | a11y §2 | Notes |
|------|--------|----------------|---------------|---------|--------|
| | | | pass / fail | pass / fail | |

---

*Last updated: 2026-04-11*
