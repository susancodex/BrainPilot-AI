# BrainPilot AI

An AI-powered study companion SaaS that helps students plan, revise, quiz themselves, and track academic progress — built with Django 6 + React 19 and powered by Google Gemini with automatic multi-provider failover.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [AI Gateway](#ai-gateway)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)

## Features

| Feature | Description |
|---|---|
| **AI Study Planner** | Personalised daily/weekly schedules with built-in spaced repetition |
| **Smart Notes** | Rich-text editor with AI summarisation and one-click flashcard generation |
| **AI Quizzes** | MCQ, true/false, and short-answer quizzes with personalised coaching feedback |
| **Spaced Repetition** | Flashcard review system with difficulty tracking and due-date scheduling |
| **Revision Tracker** | Log revision topics; automatically surfaces weak areas |
| **Learning Goals** | Goal tracking with progress milestones |
| **AI Chatbot** | Real-time study assistant with SSE streaming word-by-word |
| **Analytics** | Study trends, subject breakdowns, and performance reports |
| **Pomodoro & Focus Logs** | Built-in Pomodoro timer with streak tracking |
| **PDF Processing** | Upload and query study materials with AI |
| **Multi-Provider AI** | Gemini → Groq → OpenRouter automatic failover with health monitoring |
| **Notifications** | In-app alert system |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│   Vite · Tailwind CSS · TanStack Query · Zustand · Tiptap   │
│                      Port 5000                               │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP /api/v1/* (proxied)
┌──────────────────────▼──────────────────────────────────────┐
│                     Backend (Django)                         │
│    DRF · SimpleJWT · Celery · drf-spectacular                │
│                      Port 8000                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    AI Gateway                         │   │
│  │   Gemini (primary) → Groq → OpenRouter (fallback)    │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │   PostgreSQL    │
              └─────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, Zustand, TanStack Query |
| **UI Components** | Radix UI, shadcn/ui, Tiptap (rich text) |
| **Backend** | Python 3.12, Django 6, Django REST Framework |
| **Authentication** | JWT via `djangorestframework-simplejwt` |
| **AI (Primary)** | Google Gemini `gemini-2.5-flash` |
| **AI (Fallback 1)** | Groq `llama-3.3-70b-versatile` |
| **AI (Fallback 2)** | OpenRouter (free-tier model rotation) |
| **Database** | PostgreSQL |
| **Task Queue** | Celery (synchronous in dev, Redis-backed in production) |
| **PDF Processing** | pypdf |
| **API Docs** | drf-spectacular (OpenAPI 3.1) |
| **Static Files** | WhiteNoise (production) |

## Local Development

### Prerequisites

- Node.js 20+ and pnpm 10+
- Python 3.12+
- PostgreSQL 15+
- Redis (optional — Celery falls back to synchronous execution without it)

### 1. Clone the repository

```bash
git clone https://github.com/your-org/brainpilot.git
cd brainpilot
```

### 2. Install dependencies

```bash
# Frontend and shared packages
pnpm install

# Backend
cd backend
pip install uv
uv sync
```

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — see Environment Variables below
```

### 4. Set up the database

```bash
cd backend
python manage.py migrate
python manage.py createsuperuser  # optional
```

### 5. Start both servers

```bash
# Terminal 1 — Backend API (port 8000)
cd backend
make run

# Terminal 2 — Frontend (port 5000)
pnpm --filter @workspace/brainpilot-web run dev
```

The frontend proxies all `/api/*` and `/media/*` requests to the backend at `http://localhost:8000`.

### Backend commands

```bash
cd backend
make run              # start dev server on :8000
make migrate          # apply pending migrations
make makemigrations   # generate new migration files
make test             # run full test suite
make test-cov         # run tests with coverage report
make lint             # run ruff linter
make format           # run ruff formatter
make shell            # Django interactive shell
make help             # list all commands
```

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in the values:

| Variable | Required | Description |
|---|---|---|
| `DJANGO_SECRET_KEY` | ✅ | Django secret key — generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `GEMINI_API_KEY` | ✅ | Google Gemini key from [aistudio.google.com](https://aistudio.google.com/apikey) |
| `DJANGO_SETTINGS_MODULE` | ✅ | `config.settings.development` or `config.settings.production` |
| `GEMINI_MODEL` | — | Model override (default: `gemini-2.5-flash`) |
| `REDIS_URL` | — | Redis URL for Celery (default: `redis://localhost:6379/0`) |
| `ALLOWED_HOSTS` | — | Comma-separated hosts for production |
| `CORS_ALLOWED_ORIGINS` | — | Comma-separated CORS origins for production |
| `FRONTEND_URL` | — | Base URL for email verification links |
| `EMAIL_HOST_USER` | — | SMTP username |
| `EMAIL_HOST_PASSWORD` | — | SMTP password |
| `GROQ_API_KEY` | — | Groq key for AI fallback |
| `OPENROUTER_API_KEY` | — | OpenRouter key for secondary AI fallback |

## API Reference

All endpoints are under `/api/v1/`. Interactive docs are available at `/api/v1/schema/swagger-ui/` when the server is running.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `auth/register/` | Create account |
| POST | `auth/login/` | Login, receive JWT tokens |
| POST | `auth/logout/` | Blacklist refresh token |
| GET/PATCH | `auth/me/` | Current user profile |
| POST | `auth/password/reset/` | Request password reset |
| POST | `token/refresh/` | Refresh access token |

### Core Features
| Method | Endpoint | Description |
|---|---|---|
| POST | `planner/plans/generate/` | AI-generate a study plan |
| POST | `notes/<id>/summarize/` | AI-summarise a note |
| POST | `notes/<id>/flashcards/generate/` | Generate flashcards from note |
| POST | `quizzes/generate/` | AI-generate a quiz |
| POST | `quizzes/<id>/submit/` | Submit answers, get AI coaching feedback |
| POST | `chatbot/send/` | Chat message (full JSON response) |
| POST | `chatbot/send/stream/` | Chat message (SSE streaming) |

See [`docs/backend/api-reference.md`](docs/backend/api-reference.md) for the complete endpoint listing.

## AI Gateway

BrainPilot uses a **three-provider failover gateway** to ensure AI features remain available even if a single provider is rate-limited or unavailable.

```
Request → Gemini (primary)
             ↓ rate-limit / error
          Groq (fallback 1)
             ↓ rate-limit / error
          OpenRouter (fallback 2)
             ↓ all providers exhausted
          Graceful error → user-friendly message
```

- After 3 consecutive failures a provider enters a 5-minute cooldown
- Prompt injection attempts are blocked before any API call is made
- Provider health is exposed at `GET /api/v1/ai/health/`

## Deployment

### Docker Compose

```bash
cd backend
cp .env.example .env   # fill in production values
docker-compose up --build
```

### Render

A `backend/deployment/render.yaml` blueprint is included for one-click Render deployment.

See [`docs/deployment/guide.md`](docs/deployment/guide.md) for full production configuration including HTTPS, static files, Celery workers, and environment hardening.

## Testing

```bash
cd backend
make test             # run all tests
make test-cov         # with HTML coverage report
pytest tests/test_api_auth.py -v   # specific module
```

See [`docs/testing/guide.md`](docs/testing/guide.md) for the full testing strategy.

## Security

- JWT access tokens expire after 60 minutes with automatic refresh token rotation
- Passwords hashed with Django PBKDF2 (100,000 iterations)
- Rate limiting: 30/min anonymous · 120/min authenticated · 10/min auth endpoints
- Prompt injection detection on all AI inputs
- Full security headers in production (HSTS, X-Frame-Options, Content-Type-Options)
- Account lockout after 5 failed login attempts (15-minute cooldown)

See [`SECURITY.md`](SECURITY.md) to report vulnerabilities.

## Project Structure

```
brainpilot/
├── frontend/               React 19 + Vite application
│   └── src/
│       ├── components/     Shared UI components (shadcn/ui)
│       ├── hooks/          Domain-specific API hooks
│       ├── pages/          Route-level page components
│       ├── store/          Zustand global state
│       └── types/          TypeScript interfaces
│
├── backend/                Django REST API
│   ├── ai/                 Multi-provider AI gateway
│   ├── apps/               11 feature applications
│   ├── services/ai_engine/ Prompt templates, workflows, memory
│   ├── common/             Base models, exceptions, responses
│   └── config/             Settings (base / development / production)
│
└── lib/                    Shared TypeScript workspace packages
    ├── api-client-react/   Generated typed API hooks
    ├── api-spec/           OpenAPI specification
    └── api-zod/            Generated Zod validation schemas
```

## Contributing

Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request.

## License

MIT — see [`LICENSE`](LICENSE) for details.
