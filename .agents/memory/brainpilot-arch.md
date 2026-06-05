---
name: BrainPilot architecture
description: Key layout, workflow, and run conventions for the BrainPilot Django backend
---

# BrainPilot Architecture

The backend is a Python/Django app living in `backend/` and served via the backend workflow on port 8000.

**Why:** The user chose Django/Python for the backend. The app now runs directly from the `backend/` tree.

**How to apply:** Never create a second workflow for Django. Run commands from `backend/` with `PYTHONPATH=$(pwd) DJANGO_SETTINGS_MODULE=config.settings.development`.

## Key paths
- Entry: `backend/run_dev.sh` (dev), `backend/scripts/start.sh` (prod)
- Settings: `backend/config/settings/{base,development,production}.py`
- Apps: `backend/apps/` — 11 apps (accounts, planner, goals, revision, notes, quizzes, chatbot, analytics, productivity, dashboard, notifications)
- AI layer: `backend/services/ai_engine/` — adapters, workflows, prompts, memory
- Dev commands: `cd backend && make <command>`
