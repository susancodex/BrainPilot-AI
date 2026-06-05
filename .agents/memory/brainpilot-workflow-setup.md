---
name: BrainPilot workflow setup
description: How to start both services, env var requirements, and path/port details after reorganization.
---

## Services

Single combined workflow "Start application" on port 5000 (webview):

```bash
bash -c 'cd /home/runner/workspace/backend && DJANGO_SETTINGS_MODULE=config.settings.development python manage.py migrate --run-syncdb 2>&1 | tail -5; DJANGO_SETTINGS_MODULE=config.settings.development python manage.py runserver localhost:8000 & cd /home/runner/workspace && pnpm install --no-frozen-lockfile 2>&1 | tail -5 && PORT=5000 pnpm --filter @workspace/brainpilot-web dev'
```

Backend on port 8000 (localhost), Vite frontend on port 5000 (0.0.0.0).

## Python setup

- The backend targets Python 3.11 (available in Replit as python3).
- Dependencies installed via `pip install` (uv not available in Replit env), against `backend/requirements/development.txt`.
- Django 5.x (not 6.x) — Django 6 requires Python >=3.12 which is unavailable.

## pnpm version

- Replit has **pnpm 10.26.1** installed (not 11.x).
- `package.json` `packageManager` field must be `"pnpm@10.26.1"` (not 11.5.1) to prevent self-install loop.
- Use `pnpm install --no-frozen-lockfile` (lockfile was generated with 11.x).

## Env vars

- `DJANGO_SETTINGS_MODULE=config.settings.development`
- `DJANGO_SECRET_KEY` — value set in userenv
- `PORT=5000`, `BASE_PATH=/`
- `GEMINI_API_KEY` — AI Studio key (must start with "AIza", 39 chars)

## Gemini AI adapter

- Adapter (`backend/services/ai_engine/adapters/gemini_adapter.py`) checks for `AI_INTEGRATIONS_GEMINI_API_KEY` + `AI_INTEGRATIONS_GEMINI_BASE_URL` first, then falls back to `GEMINI_API_KEY` (stripped of whitespace).
- Model default: `gemini-2.0-flash` (set in `backend/config/settings/base.py` via `GEMINI_MODEL` env var).
- Free-tier quota: `gemini-2.5-flash` = 20 req/day; `gemini-2.0-flash` varies by project. Exhausted quotas reset at midnight Pacific.

## Directory layout (after reorganization)

```
frontend/    ← React/Vite app (package: @workspace/brainpilot-web)
backend/     ← Django 5.2 API
lib/         ← Shared TS packages (api-client-react etc.)
docs/        ← Reference docs (renamed from attached_assets/)
scripts/     ← Workspace tooling
artifacts/   ← Legacy prototype packages; no longer part of the active app
```

Frontend was moved from the legacy artifact package to `frontend/`. The workflow filter (`@workspace/brainpilot-web`) resolves by package name so no workflow command change was needed.

## API import path in frontend

All hooks import the axios client as `import api from "@/lib/api"` (NOT `@/lib/axios`).

## Port conflict note

If Django fails "port in use", wait a few seconds and restart `BrainPilot Backend`.
