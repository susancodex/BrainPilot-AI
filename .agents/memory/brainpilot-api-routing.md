---
name: BrainPilot API routing
description: Full URL map for the BrainPilot Express/TypeScript API server, route prefix conventions, and key gotchas.
---

## Route prefix convention (CRITICAL)

The Express app (`app.ts`) mounts all routes at `/api`. Route handlers must use bare paths like `/tasks`, `/quizzes` (NOT `/v1/tasks`).

- Generated client calls: `/api/tasks`, `/api/quizzes`, `/api/flashcard-decks`, etc.
- Routes are mounted at `/api`, so handlers use: `/tasks`, `/quizzes`, etc.
- If you write `/v1/tasks` in a handler, the full path becomes `/api/v1/tasks` → 404 from client.

**Why:** The API client was generated from an OpenAPI spec with paths like `/api/tasks`. The Express app mounts at `/api`, so route handlers must only specify the suffix after `/api`.

## Full URL map (client → handler)

| Client calls | Handler path | File |
|---|---|---|
| GET /api/dashboard/summary | /dashboard/summary | dashboard.ts |
| GET /api/dashboard/activity | /dashboard/activity | dashboard.ts |
| GET /api/dashboard/recommendations | /dashboard/recommendations | dashboard.ts |
| GET/POST /api/tasks | /tasks | tasks.ts |
| POST /api/tasks/:id/complete | /tasks/:id/complete | tasks.ts |
| DELETE /api/tasks/:id | /tasks/:id | tasks.ts |
| GET/POST /api/goals | /goals | goals.ts |
| PUT/DELETE /api/goals/:id | /goals/:id | goals.ts |
| GET/POST /api/flashcard-decks | /flashcard-decks | flashcards.ts |
| GET/DELETE /api/flashcard-decks/:id | /flashcard-decks/:id | flashcards.ts |
| POST /api/flashcard-decks/:deckId/cards | /flashcard-decks/:deckId/cards | flashcards.ts |
| PUT/DELETE /api/flashcard-decks/:deckId/cards/:cardId | /flashcard-decks/:deckId/cards/:cardId | flashcards.ts |
| GET/POST /api/quizzes | /quizzes | quizzes.ts |
| GET/DELETE /api/quizzes/:id | /quizzes/:id | quizzes.ts |
| POST /api/quizzes/:id/submit | /quizzes/:id/submit | quizzes.ts |
| GET/POST /api/chats | /chats | chats.ts |
| GET/DELETE /api/chats/:id | /chats/:id | chats.ts |
| POST /api/chats/:id/messages | /chats/:id/messages | chats.ts |
| GET/POST /api/revisions | /revisions | revisions.ts |
| POST /api/revisions/:id/review | /revisions/:id/review | revisions.ts |
| DELETE /api/revisions/:id | /revisions/:id | revisions.ts |
| GET/POST /api/pdfs | /pdfs | pdfs.ts |
| DELETE /api/pdfs/:id | /pdfs/:id | pdfs.ts |
| GET/POST /api/notifications | /notifications | notifications.ts |
| POST /api/notifications/:id/read | /notifications/:id/read | notifications.ts |
| POST /api/notifications/read-all | /notifications/read-all | notifications.ts |
| GET/POST /api/sessions | /sessions | sessions.ts |

## Other key facts

- Stack: Express + Drizzle + PostgreSQL (TypeScript, NOT Django)
- API server port: 8000, artifact dir: artifacts/api-server
- `pg` must be a direct dependency of `@workspace/api-server` (not just in `@workspace/db`)
- DB connection: `artifacts/api-server/src/lib/db.ts` exports `db` using drizzle + pg Pool from DATABASE_URL
- Seed via REST API calls (not tsx/ts-node) — the build outputs ESM and schema imports are TypeScript
- Notifications need a POST route to be seedable; one was added to notifications.ts
