# BrainPilot AI

An AI-powered study companion SaaS backend — helps students plan, revise, quiz themselves, and track academic progress using Google Gemini.

## Run & Operate

- The Django API server runs automatically via the **`BrainPilot Django Backend`** workflow
- Health check: `GET /api/v1/health/`
- All endpoints are prefixed with `/api/v1/`

### Dev server (from `backend/`):
```bash
make run
# or manually:
cd backend && bash run_dev.sh
```

### Migrations:
```bash
cd backend && make migrate
cd backend && make makemigrations
```

### Django shell:
```bash
cd backend && make shell
```

### All dev commands:
```bash
cd backend && make help
```

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Python 3.12, Django 6 |
| API | Django REST Framework |
| Auth | JWT via `djangorestframework-simplejwt` |
| AI | Google Gemini `gemini-2.5-flash` (`google-genai` SDK) |
| DB | PostgreSQL (Replit managed) |
| Async | Celery (eager/sync in dev, Redis broker in prod) |
| Server | Django dev server (dev) / Gunicorn (prod) |
| Static | WhiteNoise (prod) |

## Project Layout

```
backend/
├── apps/                   11 feature apps
│   ├── accounts/           auth, JWT, user profiles
│   ├── planner/            AI study plans + sessions
│   ├── goals/              learning goals
│   ├── revision/           spaced-repetition topics
│   ├── notes/              rich notes
│   ├── quizzes/            AI quiz generation + attempts
│   ├── chatbot/            Gemini chat + SSE streaming
│   ├── analytics/          study trend queries
│   ├── productivity/       Pomodoro, focus logs, streaks
│   ├── dashboard/          summary view
│   └── notifications/      in-app alerts
├── services/
│   └── ai_engine/
│       ├── adapters/       gemini_adapter.py — all Gemini calls
│       ├── workflows/      quiz_workflow, study_planner_workflow
│       ├── prompts/        quiz_generation, study_plan, quiz_feedback, summary_generation
│       └── memory/         conversation_memory (system prompt builder)
├── common/                 base models, exceptions, responses, pagination
├── config/
│   ├── settings/
│   │   ├── base.py         shared settings
│   │   ├── development.py  console logging, debug toolbar, eager Celery
│   │   └── production.py   WhiteNoise, security headers, file logging to /tmp
│   ├── urls.py             root URL conf
│   ├── wsgi.py
│   └── asgi.py
├── scripts/
│   └── start.sh            production Gunicorn startup (migrate → collectstatic → serve)
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
├── Makefile                common dev commands
├── .env.example            all env var documentation
└── run_dev.sh              dev server entrypoint
```

## AI-Powered Endpoints

| Endpoint | What Gemini does |
|----------|-----------------|
| `POST /api/v1/chatbot/send/` | Study assistant reply (full JSON response) |
| `POST /api/v1/chatbot/send/stream/` | Same, streamed word-by-word via SSE |
| `POST /api/v1/quizzes/generate/` | Generates MCQ + T/F + short answer quiz from topic or notes |
| `POST /api/v1/quizzes/<id>/submit/` | Personalised coaching feedback after each attempt |
| `POST /api/v1/planner/plans/generate/` | Builds daily/weekly/emergency schedule with spaced repetition |

## Full API Reference (all under `/api/v1/`)

| Module | Path |
|--------|------|
| Health | `health/` |
| Auth | `auth/register/`, `auth/login/`, `auth/logout/`, `auth/me/`, `auth/me/profile/`, `auth/password/reset/` |
| Token | `token/refresh/` |
| Planner | `planner/plans/`, `planner/plans/generate/`, `planner/plans/<id>/`, `planner/sessions/`, `planner/sessions/<id>/` |
| Goals | `goals/` |
| Revision | `revision/topics/`, `revision/record/` |
| Notes | `notes/` |
| Quizzes | `quizzes/`, `quizzes/generate/`, `quizzes/<id>/`, `quizzes/<id>/submit/`, `quizzes/attempts/` |
| Chatbot | `chatbot/conversations/`, `chatbot/conversations/<id>/`, `chatbot/send/`, `chatbot/send/stream/` |
| Analytics | `analytics/trends/`, `analytics/subjects/`, `analytics/report/` |
| Productivity | `productivity/pomodoro/`, `productivity/streak/`, `productivity/focus-logs/` |
| Dashboard | `dashboard/summary/` |
| Notifications | `notifications/` |

## Required Env Vars

| Variable | Source | Notes |
|----------|--------|-------|
| `DATABASE_URL` | Replit managed | Auto-set in deployed env |
| `GEMINI_API_KEY` | Replit Secrets | Get from aistudio.google.com |
| `DJANGO_SECRET_KEY` | Replit Secrets | Generate with `get_random_secret_key()` |

## Architecture Notes

- **Service layer**: views are thin; all business logic in `services.py` per app; all AI logic in `services/ai_engine/`.
- **SSE streaming**: `chatbot/send/stream/` uses Django `StreamingHttpResponse` + Gemini `generate_content_stream`. Events: `chunk`, `done`, `error`.
- **Celery is fault-tolerant**: task `.delay()` calls are wrapped in try/except — server gracefully degrades without a Redis broker (expected in dev).
- **PYTHONPATH**: `backend/` must be on `PYTHONPATH` since the workflow runs from the workspace root.
- **Analytics app**: has no models — reads data cross-app from other tables.

## Gotchas

- `DJANGO_SETTINGS_MODULE=config.settings.development` must be set for dev.
- Celery broker warnings in dev are expected and non-fatal.
- Django takes ~5–10s to start on first boot (app registry + migration check).

## User preferences
