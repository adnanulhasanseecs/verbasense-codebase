# Dependency versions (verified)

Versions below were checked against **public registries** as of **April 5, 2026** (aligned with the March 2026 “latest stable” requirement). Re-verify before production releases: `npm view <pkg> version` and `pip index versions <pkg>` (or PyPI JSON API).

## Frontend (npm)

| Package | Version |
|---------|---------|
| next | 16.2.2 |
| react | 19.2.4 |
| react-dom | 19.2.4 |
| typescript | ^5 (see `frontend/package-lock.json` resolved) |
| tailwindcss | ^4 (PostCSS pipeline) |
| eslint | ^9 |
| eslint-config-next | 16.2.2 |
| jest | 30.3.0 |
| @playwright/test | 1.59.1 |
| typescript (resolved) | 5.9.3 |

## Backend (Python / PyPI)

| Package | Version |
|---------|---------|
| Python | 3.11+ (CI/dev: 3.13 verified) |
| fastapi | 0.135.3 |
| uvicorn | 0.43.0 |
| pydantic | 2.12.5 |
| pydantic-settings | 2.13.1 |
| pytest | 9.0.2 |
| httpx | 0.28.1 |
| ruff | 0.15.9 |
| black | 26.3.1 |
| mypy | 1.20.0 |
| PyYAML | 6.0.3 |
| python-multipart | 0.0.22 |

## How to re-check

```powershell
npm view next version
npm view react version
Invoke-RestMethod https://pypi.org/pypi/fastapi/json | Select-Object -ExpandProperty info | Select-Object version
```
