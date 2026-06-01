---
name: BrainPilot API routing
description: Full URL map for the Django/DRF backend, route prefix conventions, and key gotchas.
---

## Stack (IMPORTANT — this changed)

The backend is **Django + DRF + PostgreSQL** (Python), NOT Express/TypeScript. Ignore any notes about an Express stack.

- Backend: `backend/` Django project, runs on port 8000
- API client: `artifacts/brainpilot-web/src/lib/api.ts` (axios, baseURL `/api/v1`)
- Vite proxy forwards `/api/*` → `http://localhost:8000`

## Route prefix convention

All endpoints are under `/api/v1/`. The axios baseURL is `/api/v1`, so hooks call relative paths like `/auth/login/`, `/chatbot/conversations/`, etc.

## Full URL map (all under /api/v1/)

| Module | Paths |
|---|---|
| Health | `health/` |
| Auth | `auth/register/`, `auth/login/`, `auth/logout/`, `auth/me/`, `auth/me/profile/`, `auth/me/change-password/`, `auth/password/reset/`, `auth/password/reset/confirm/`, `auth/verify-email/` |
| Token | `token/refresh/` |
| Planner | `planner/plans/`, `planner/plans/generate/`, `planner/plans/<id>/`, `planner/sessions/`, `planner/sessions/<id>/` |
| Goals | `goals/`, `goals/<id>/`, `goals/<id>/progress/`, `goals/<id>/milestones/<mid>/complete/` |
| Revision | `revision/topics/`, `revision/topics/due/`, `revision/topics/weak/`, `revision/record/` |
| Notes | `notes/`, `notes/<id>/`, `notes/<id>/summarize/`, `notes/<id>/flashcards/generate/`, `notes/flashcards/`, `notes/flashcards/due/`, `notes/flashcards/<id>/review/` |
| Quizzes | `quizzes/`, `quizzes/generate/`, `quizzes/<id>/`, `quizzes/<id>/submit/`, `quizzes/attempts/` |
| Chatbot | `chatbot/conversations/`, `chatbot/conversations/<id>/`, `chatbot/send/`, `chatbot/send/stream/` |
| Analytics | `analytics/trends/`, `analytics/subjects/`, `analytics/quiz-performance/`, `analytics/revision/`, `analytics/report/` |
| Productivity | `productivity/pomodoro/`, `productivity/pomodoro/<id>/complete/`, `productivity/sessions/complete/`, `productivity/streak/`, `productivity/focus-logs/` |
| Dashboard | `dashboard/summary/` |
| Notifications | `notifications/`, `notifications/<id>/read/`, `notifications/read-all/` |
| PDFs | `pdfs/`, `pdfs/<id>/`, `pdfs/<id>/chat/`, `pdfs/<id>/highlights/`, `pdfs/<id>/highlights/<hid>/` |
| Subscriptions | `subscriptions/`, `subscriptions/plans/` |

## AI engine

- Adapter: `backend/services/ai_engine/adapters/gemini_adapter.py` (Google Gemini `gemini-2.5-flash`)
- Requires `GEMINI_API_KEY` env var
- Streaming chat: `chatbot/send/stream/` uses Django `StreamingHttpResponse` + SSE events: `chunk`, `done`, `error`
