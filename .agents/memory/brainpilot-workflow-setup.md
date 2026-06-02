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

- Python 3.12 module (`python-3.12`) must be installed via `installProgrammingLanguage`.
- Binary is at `/home/runner/workspace/.pythonlibs/bin/python3.12`.
- `backend/run_dev.sh` uses `uv sync --python python3.12` then `uv run --no-sync` to avoid venv teardown between commands.

## Env vars (set in `.replit` userenv.shared)

- `DJANGO_SETTINGS_MODULE=config.settings.development`
- `DJANGO_SECRET_KEY` — value set in userenv
- `PORT=5000`, `BASE_PATH=/`
- `GEMINI_API_KEY` — Replit Secret

## Directory layout (after reorganization)

```
frontend/    ← React/Vite app (package: @workspace/brainpilot-web)
backend/     ← Django 6 API
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
