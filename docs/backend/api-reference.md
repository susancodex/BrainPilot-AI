# API Reference

All endpoints are under the `/api/v1/` prefix. Every request (except auth and health) requires:

```
Authorization: Bearer <access-token>
```

Interactive documentation with request/response schemas:

- **Swagger UI**: `/api/v1/schema/swagger-ui/`
- **ReDoc**: `/api/v1/schema/redoc/`
- **OpenAPI JSON**: `/api/v1/schema/`

---

## Response Envelope

All responses use a consistent structure:

```json
{
  "status": "success",
  "message": "Optional human-readable message",
  "data": { ... }
}
```

Paginated list responses include:

```json
{
  "status": "success",
  "data": {
    "count": 42,
    "next": "http://...",
    "previous": null,
    "results": [ ... ]
  }
}
```

Error responses:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "email": ["Enter a valid email address."]
  }
}
```

---

## Rate Limits

| Scope | Limit |
|-------|-------|
| Anonymous | 30 req/min |
| Authenticated | 120 req/min |
| Auth endpoints | 10 req/min |

Exceeding the limit returns `429 Too Many Requests`.

---

## Modules

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health/` | No | Liveness probe |
| GET | `/api/v1/ai/health/` | No | AI gateway provider health |

---

### Auth

See [authentication.md](authentication.md) for the full auth flow.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register/` | Create account |
| POST | `/api/v1/auth/login/` | Login |
| POST | `/api/v1/auth/logout/` | Logout (blacklist token) |
| GET | `/api/v1/auth/me/` | Get current user |
| PATCH | `/api/v1/auth/me/` | Update user fields |
| GET | `/api/v1/auth/me/profile/` | Get extended profile |
| PATCH | `/api/v1/auth/me/profile/` | Update extended profile |
| POST | `/api/v1/auth/password/reset/` | Request password reset |
| POST | `/api/v1/auth/password/reset/confirm/` | Confirm password reset |
| POST | `/api/v1/auth/me/change-password/` | Change password (authenticated) |
| POST | `/api/v1/token/refresh/` | Refresh access token |

---

### Study Planner

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/planner/plans/` | List all plans |
| POST | `/api/v1/planner/plans/` | Create a plan manually |
| POST | `/api/v1/planner/plans/generate/` | AI-generate a study plan |
| GET | `/api/v1/planner/plans/<id>/` | Get plan with sessions |
| PATCH | `/api/v1/planner/plans/<id>/` | Update plan |
| DELETE | `/api/v1/planner/plans/<id>/` | Delete plan |
| GET | `/api/v1/planner/sessions/` | List all sessions |
| PATCH | `/api/v1/planner/sessions/<id>/` | Update session status |

**Generate plan request:**

```json
{
  "subjects": ["Mathematics", "Physics"],
  "target_date": "2026-06-30",
  "daily_hours": 3,
  "goal": "Pass final exams"
}
```

---

### Notes & Flashcards

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/notes/` | List notes |
| POST | `/api/v1/notes/` | Create note |
| GET | `/api/v1/notes/<id>/` | Get note |
| PATCH | `/api/v1/notes/<id>/` | Update note |
| DELETE | `/api/v1/notes/<id>/` | Delete note |
| POST | `/api/v1/notes/<id>/summarize/` | Generate AI summary |
| POST | `/api/v1/notes/<id>/flashcards/generate/` | Generate flashcards from note |
| GET | `/api/v1/notes/flashcards/` | List all flashcards |
| GET | `/api/v1/notes/flashcards/due/` | Flashcards due for review |
| POST | `/api/v1/notes/flashcards/<id>/review/` | Record review result |

---

### Quizzes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/quizzes/` | List quizzes |
| POST | `/api/v1/quizzes/generate/` | AI-generate a quiz |
| GET | `/api/v1/quizzes/<id>/` | Get quiz with questions |
| DELETE | `/api/v1/quizzes/<id>/` | Delete quiz |
| POST | `/api/v1/quizzes/<id>/submit/` | Submit answers, get AI feedback |
| GET | `/api/v1/quizzes/attempts/` | List all attempts |

**Generate quiz request:**

```json
{
  "subject": "Organic Chemistry",
  "topic": "Alkanes and Alkenes",
  "question_count": 10,
  "difficulty": "medium"
}
```

Minimum `question_count` is 3.

---

### Chatbot

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/chatbot/conversations/` | List conversations |
| GET | `/api/v1/chatbot/conversations/<id>/` | Get conversation with messages |
| DELETE | `/api/v1/chatbot/conversations/<id>/` | Delete conversation |
| POST | `/api/v1/chatbot/send/` | Send message (JSON response) |
| POST | `/api/v1/chatbot/send/stream/` | Send message (SSE stream) |

**SSE stream events:**

```
data: {"type": "chunk", "content": "Hello"}
data: {"type": "chunk", "content": " there"}
data: {"type": "done", "message_id": "uuid"}
data: {"type": "error", "message": "Provider unavailable"}
```

---

### Goals

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/goals/` | List goals |
| POST | `/api/v1/goals/` | Create goal |
| GET | `/api/v1/goals/<id>/` | Get goal |
| PATCH | `/api/v1/goals/<id>/` | Update goal |
| DELETE | `/api/v1/goals/<id>/` | Delete goal |
| POST | `/api/v1/goals/<id>/progress/` | Log progress update |

---

### Revision

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/revision/topics/` | List topics |
| POST | `/api/v1/revision/topics/` | Add topic |
| GET | `/api/v1/revision/topics/due/` | Topics due today |
| GET | `/api/v1/revision/topics/weak/` | Topics with low confidence |
| POST | `/api/v1/revision/record/` | Record a revision session |

---

### Productivity

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/productivity/pomodoro/` | List Pomodoro sessions |
| POST | `/api/v1/productivity/pomodoro/` | Create session |
| GET | `/api/v1/productivity/streak/` | Get current streak |
| GET | `/api/v1/productivity/focus-logs/` | List focus logs |
| POST | `/api/v1/productivity/focus-logs/` | Log a focus session |

---

### Analytics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/analytics/trends/` | Study time trends |
| GET | `/api/v1/analytics/subjects/` | Per-subject breakdown |
| GET | `/api/v1/analytics/report/` | Full performance report |

Query params: `period=7d|30d|90d`, `subject=<name>`

---

### Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/dashboard/summary/` | Aggregated home screen data |

---

### Notifications

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/notifications/` | List notifications |
| PATCH | `/api/v1/notifications/<id>/` | Mark as read |
| DELETE | `/api/v1/notifications/<id>/` | Delete notification |

---

### PDFs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/pdfs/` | List uploaded PDFs |
| POST | `/api/v1/pdfs/` | Upload a PDF |
| GET | `/api/v1/pdfs/<id>/` | Get PDF details |
| DELETE | `/api/v1/pdfs/<id>/` | Delete PDF |
