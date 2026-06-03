---
name: BrainPilot workflow setup
description: How to start both services, env var requirements, and path/port details after reorganization.
---

## Services

| Service | Workflow name | Command | Port |
|---------|--------------|---------|------|
| Backend | BrainPilot Backend | `bash backend/run_dev.sh` | 8000 |
| Frontend | BrainPilot Frontend | `pnpm --filter @workspace/brainpilot-web run dev` | 5000 |

Both start in parallel via the **Project** workflow (run button). Frontend serves at port 5000 (webview).

## Python setup

- Only **Python 3.11.14** is available in this Replit (`.replit` module: `python-3.11`).
- `python-3.12` is NOT available — uv Python downloads are set to 'never'.
- `backend/run_dev.sh` uses `uv sync --python python3.11` then `uv run --no-sync`.
- `pyproject.toml` must use `requires-python = ">=3.11"` and `django>=5.2,<6.0` (Django 6 requires Python 3.12).

## Django version

- **Django 5.2 LTS** (not 6.x) — Django 6 requires Python >=3.12 which is unavailable.
- `pyproject.toml` is the source of truth for `uv sync` — `requirements/*.txt` files are legacy and NOT used by the dev runner.

## Env vars (set in `.replit` userenv.shared)

- `DJANGO_SETTINGS_MODULE=config.settings.development`
- `DJANGO_SECRET_KEY` — value set in userenv
- `PORT=5000`, `BASE_PATH=/`
- `GEMINI_API_KEY` — Replit Secret (must be a valid AI Studio key starting with "AIza", 39 chars)

## Gemini AI adapter

- Adapter (`backend/services/ai_engine/adapters/gemini_adapter.py`) checks for `AI_INTEGRATIONS_GEMINI_API_KEY` + `AI_INTEGRATIONS_GEMINI_BASE_URL` first (Replit AI Integrations proxy), then falls back to `GEMINI_API_KEY` (stripped of whitespace).
- Model default: `gemini-2.0-flash` (set in `backend/config/settings/base.py` via `GEMINI_MODEL` env var).
- Free-tier quota: `gemini-2.5-flash` = 20 req/day; `gemini-2.0-flash` varies by project. Exhausted quotas reset at midnight Pacific.

## Directory layout (after reorganization)

```
frontend/    ← React/Vite app (package: @workspace/brainpilot-web)
backend/     ← Django 5.2 API
lib/         ← Shared TS packages (api-client-react etc.)
docs/        ← Reference docs (renamed from attached_assets/)
scripts/     ← Workspace tooling
artifacts/   ← Replit artifact stubs ONLY — not active source code
```

Frontend was moved from `artifacts/brainpilot-web/` → `frontend/`. The workflow filter (`@workspace/brainpilot-web`) resolves by package name so no workflow command change was needed.

## API import path in frontend

All hooks import the axios client as `import api from "@/lib/api"` (NOT `@/lib/axios`).

## Port conflict note

The `artifacts/api-server` workflow also targets port 8000. It finishes quickly. If Django fails "port in use", wait a few seconds and restart `BrainPilot Backend`.
