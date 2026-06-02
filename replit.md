# BrainPilot AI

An AI-powered study companion SaaS — helps students plan, revise, quiz themselves, and track academic progress using Google Gemini.

## Project Layout

```
brainpilot/
├── frontend/               React 19 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/     Shared UI components (shadcn/ui)
│   │   ├── hooks/          Custom React hooks + API calls
│   │   ├── pages/          Route-level page components
│   │   ├── store/          Zustand global state
│   │   ├── types/          TypeScript interfaces
│   │   └── lib/            Utilities
│   ├── vite.config.ts      Dev server, proxy → backend :8000
│   └── package.json        @workspace/brainpilot-web
│
├── backend/                Django 6 + DRF API
│   ├── apps/               11 feature apps
│   │   ├── accounts/       Auth, JWT, user profiles
│   │   ├── planner/        AI study plans + sessions
│   │   ├── goals/          Learning goals
│   │   ├── revision/       Spaced-repetition topics
│   │   ├── notes/          Rich notes + AI summary
│   │   ├── quizzes/        AI quiz generation + attempts
│   │   ├── chatbot/        Gemini chat + SSE streaming
│   │   ├── analytics/      Study trend queries (no models)
│   │   ├── productivity/   Pomodoro, focus logs, streaks
│   │   ├── dashboard/      Summary view
│   │   └── notifications/  In-app alerts
│   ├── services/
│   │   └── ai_engine/
│   │       ├── adapters/   gemini_adapter.py — all Gemini calls
│   │       ├── workflows/  quiz_workflow, study_planner_workflow
│   │       ├── prompts/    Prompt templates
│   │       └── memory/     Conversation memory / system prompt builder
│   ├── common/             Base models, exceptions, responses, pagination
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py         Shared settings
│   │   │   ├── development.py  CORS open, debug toolbar, eager Celery
│   │   │   └── production.py   WhiteNoise, security headers, Replit CORS
│   │   └── urls.py             Root URL conf (/api/v1/)
│   ├── requirements/       base.txt / development.txt / production.txt
│   ├── Makefile            Common dev commands
│   └── run_dev.sh          uv sync → migrate → runserver :8000
│
├── lib/                    Shared TypeScript workspace packages
│   ├── api-client-react/   @workspace/api-client-react — typed API hooks
│   ├── api-spec/           OpenAPI spec
│   ├── api-zod/            Zod schemas
│   └── db/                 Drizzle schema
│
├── docs/                   Project reference documents
├── scripts/                Workspace tooling (post-merge.sh)
├── pnpm-workspace.yaml     Workspace: frontend, lib/*, scripts
└── pyproject.toml          Python deps (requires >=3.12)
```

## Running the Project

Both services start automatically when you press **Run**:

| Service | Port | Workflow |
|---------|------|---------|
| Frontend (React/Vite) | 5000 | `BrainPilot Frontend` |
| Backend (Django API) | 8000 | `BrainPilot Backend` |

The frontend proxies all `/api/*` and `/media/*` requests to `localhost:8000`.

### Backend commands (from `backend/`):
```bash
make run           # start dev server
make migrate       # apply migrations
make makemigrations  # generate new migrations
make shell         # Django shell
make help          # all available commands
```

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, Tailwind CSS 4, Zustand, TanStack Query |
| Backend | Python 3.12, Django 6, Django REST Framework |
| Auth | JWT via `djangorestframework-simplejwt` |
| AI | Google Gemini `gemini-2.5-flash` (`google-genai` SDK) |
| DB | PostgreSQL (Replit managed) |
| Async | Celery (eager/sync in dev) |
| Server | Django dev server (dev) / Gunicorn (prod) |
| Static | WhiteNoise (prod) |

## AI-Powered Endpoints

| Endpoint | What Gemini does |
|----------|-----------------|
| `POST /api/v1/chatbot/send/` | Study assistant reply (full JSON) |
| `POST /api/v1/chatbot/send/stream/` | Streamed word-by-word via SSE |
| `POST /api/v1/quizzes/generate/` | Generates MCQ + T/F + short-answer quiz |
| `POST /api/v1/quizzes/<id>/submit/` | Personalised coaching feedback |
| `POST /api/v1/planner/plans/generate/` | Daily/weekly schedule with spaced repetition |
| `POST /api/v1/notes/<id>/summarize/` | Concise note summary |
| `POST /api/v1/notes/<id>/flashcards/generate/` | Flashcards from note content |

## Full API Reference (all under `/api/v1/`)

| Module | Paths |
|--------|-------|
| Health | `health/` |
| Auth | `auth/register/`, `auth/login/`, `auth/logout/`, `auth/me/`, `auth/me/profile/`, `auth/password/reset/` |
| Token | `token/refresh/` |
| Planner | `planner/plans/`, `planner/plans/generate/`, `planner/plans/<id>/`, `planner/sessions/`, `planner/sessions/<id>/` |
| Goals | `goals/` |
| Revision | `revision/topics/`, `revision/record/` |
| Notes | `notes/`, `notes/<id>/`, `notes/<id>/summarize/`, `notes/<id>/flashcards/generate/` |
| Quizzes | `quizzes/`, `quizzes/generate/`, `quizzes/<id>/`, `quizzes/<id>/submit/`, `quizzes/attempts/` |
| Chatbot | `chatbot/conversations/`, `chatbot/conversations/<id>/`, `chatbot/send/`, `chatbot/send/stream/` |
| Analytics | `analytics/trends/`, `analytics/subjects/`, `analytics/report/` |
| Productivity | `productivity/pomodoro/`, `productivity/streak/`, `productivity/focus-logs/` |
| Dashboard | `dashboard/summary/` |
| Notifications | `notifications/` |

## External API Access

The backend API is accessible from any HTTP client (Postman, VS Code REST Client, curl, etc.):

- **Dev (Replit):** `https://<repl-domain>:8000/api/v1/`
- All CORS origins are allowed in development (`CORS_ALLOW_ALL_ORIGINS = True`)
- Production auto-allows `*.replit.dev` and `*.repl.co` origins via regex

## Required Env Vars

| Variable | Source | Notes |
|----------|--------|-------|
| `DATABASE_URL` | Replit managed | Auto-set |
| `GEMINI_API_KEY` | Replit Secrets | aistudio.google.com |
| `DJANGO_SECRET_KEY` | `.replit` userenv | Change before production |
| `DJANGO_SETTINGS_MODULE` | `.replit` userenv | `config.settings.development` |

## Architecture Notes

- **Thin views**: all business logic lives in `services.py` per app; all AI logic in `services/ai_engine/`.
- **SSE streaming**: `chatbot/send/stream/` uses `StreamingHttpResponse` + `generate_content_stream`. Events: `chunk`, `done`, `error`.
- **Celery**: task `.delay()` calls are wrapped in try/except — server degrades gracefully without a Redis broker (expected in dev).
- **PYTHONPATH**: `backend/` is on `PYTHONPATH` so Django imports resolve from `backend/` root.
- **Analytics**: has no models — queries cross-app tables at runtime.

## Gotchas

- `DJANGO_SETTINGS_MODULE=config.settings.development` must be set for dev (set in `.replit` userenv).
- Celery broker warnings in dev are expected and non-fatal.
- Django takes ~5–10s on first boot (app registry + migration check).
- Quiz generation requires `question_count >= 3` (enforced by backend serializer; frontend slider minimum is already 3).

## User preferences
