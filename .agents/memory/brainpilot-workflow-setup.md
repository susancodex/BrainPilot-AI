---
name: BrainPilot workflow setup
description: How to start both the Django backend and brainpilot-web frontend; env var requirements and artifact path conflict resolution.
---

## Services

| Service | Workflow name | Port | Command |
|---|---|---|---|
| Django backend | `BrainPilot Backend` | 8000 | `bash backend/run_dev.sh` |
| React frontend | `artifacts/brainpilot-web: web` | 23630 (ext 3000) | managed by artifact system |

## Key facts

- Backend runs via `uv run python backend/manage.py ...` — plain `python` does NOT have Django installed; always use `uv run` or let `run_dev.sh` handle it.
- `run_dev.sh` auto-runs `migrate --noinput` before starting the dev server, so new migrations are applied on restart.
- Frontend Vite config requires `PORT` and `BASE_PATH` env vars. The artifact.toml's `[services.env]` block sets these. If configuring a manual workflow, pass them inline: `PORT=23630 BASE_PATH=/ pnpm ...`.
- Vite proxy: `/api` and `/media` are proxied to `http://localhost:8000` in `vite.config.ts`. Do not hard-code API URLs in the frontend.
- The legacy `artifacts/brainpilot` artifact was moved to previewPath `/v0` to avoid DUPLICATE_PREVIEW_PATH conflict with `artifacts/brainpilot-web` at `/`.

## API import path

All frontend hooks import the axios client as `import api from "@/lib/api"` (NOT `@/lib/axios`).

**Why:** The api client file is `src/lib/api.ts` — this was discovered when new hooks errored with "Failed to resolve import @/lib/axios".
