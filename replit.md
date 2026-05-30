# BrainPilot AI

An AI-powered study companion SaaS backend — helps students plan, revise, quiz themselves, and track their academic progress with Gemini AI.

## Run & Operate

- The Django API server runs automatically via the `artifacts/api-server: API Server` workflow
- Health check: `GET /api/v1/health/`
- All endpoints are under `/api/v1/`

### Manual dev run (from workspace root):
```bash
PYTHONPATH=/home/runner/workspace/backend DJANGO_SETTINGS_MODULE=config.settings.development python /home/runner/workspace/backend/manage.py runserver 0.0.0.0:8000
```

### Django management:
```bash
cd backend && PYTHONPATH=. DJANGO_SETTINGS_MODULE=config.settings.development python manage.py <command>
```

### Migrations:
```bash
cd backend && PYTHONPATH=. DJANGO_SETTINGS_MODULE=config.settings.development python manage.py makemigrations
cd backend && PYTHONPATH=. DJANGO_SETTINGS_MODULE=config.settings.development python manage.py migrate
```

## Stack

- **Runtime**: Python 3.12, Django 6, Django REST Framework
- **DB**: PostgreSQL (Replit managed) + Django ORM
- **Auth**: JWT via `djangorestframework-simplejwt`
- **AI**: Google Gemini (`google-genai` SDK) — `gemini-2.0-flash`
- **Async**: Celery (eager mode in dev, needs Redis broker in prod)
- **Server**: Django dev server (dev), Gunicorn (prod)

## Where things live

```
backend/
  config/          — Django settings (base, development, production), URLs, WSGI
  apps/            — 11 feature apps (accounts, planner, goals, revision, notes,
                     quizzes, chatbot, analytics, productivity, dashboard, notifications)
  services/        — Shared services: ai_engine (Gemini adapter, workflows, tasks)
  common/          — Base models, exceptions, permissions, responses, pagination
  requirements/    — base.txt, development.txt, production.txt
```

## Architecture decisions

- **Django over Node**: user chose Python/Django for the backend; the existing Node.js `artifacts/api-server` artifact shell is kept but now runs Django on port 8000 via PYTHONPATH.
- **11 apps**: each domain (auth, planner, goals, revision, notes, quizzes, chatbot, analytics, productivity, dashboard, notifications) is an independent Django app.
- **Service layer pattern**: views are thin; all business logic lives in `services.py` per app. AI logic is in `services/ai_engine/`.
- **Celery task dispatch is fault-tolerant**: `.delay()` calls are wrapped in try/except so the server gracefully degrades if no broker is available (development without Redis).
- **PYTHONPATH must be set**: `backend/` must be on `PYTHONPATH` since the artifact workflow runs from the workspace root, not `backend/`. The artifact.toml sets `PYTHONPATH=/home/runner/workspace/backend`.

## API Endpoints (all under /api/v1/)

| Module | Path prefix |
|--------|------------|
| Health | `health/` |
| Auth | `auth/` (register, login, logout, me, me/profile, password/reset/) |
| Planner | `planner/plans/`, `planner/sessions/` |
| Goals | `goals/` |
| Revision | `revision/topics/`, `revision/record/` |
| Notes | `notes/` |
| Quizzes | `quizzes/`, `quizzes/generate/`, `quizzes/<id>/submit/` |
| Chatbot | `chatbot/conversations/`, `chatbot/send/` |
| Analytics | `analytics/trends/`, `analytics/subjects/`, `analytics/report/` |
| Productivity | `productivity/pomodoro/`, `productivity/streak/`, `productivity/focus-logs/` |
| Dashboard | `dashboard/summary/` |
| Notifications | `notifications/` |

## Required Env Vars

- `DATABASE_URL` — PostgreSQL connection string (Replit managed)
- `GEMINI_API_KEY` — Google AI API key (set in Replit secrets)
- `SESSION_SECRET` — Django SECRET_KEY equivalent (set in Replit secrets)

## Gotchas

- Always set `PYTHONPATH=/home/runner/workspace/backend` when running Django from workspace root.
- `DJANGO_SETTINGS_MODULE=config.settings.development` for local dev.
- Celery tasks will warn "broker unavailable" in dev — this is expected and non-fatal.
- `analytics` app has no models — it reads data from other app tables.
- Django takes ~10s to start (migrations check + app loading); the workflow health check allows for this.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._
