# Architecture Overview

## System Design

BrainPilot is a monorepo containing a React single-page application and a Django REST API. The two services communicate exclusively through a versioned HTTP API. There is no shared runtime — the frontend is a pure client, and the backend owns all data and business logic.

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (React SPA)                       │
│                                                              │
│  TanStack Query  ─── /api/v1/* ───►  Vite dev proxy         │
│  Zustand store                        (port 5000)            │
└──────────────────────────────────────────┬──────────────────┘
                                           │ HTTP
┌──────────────────────────────────────────▼──────────────────┐
│                    Django REST API                           │
│                     (port 8000)                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  URL router → Views → Serializers → Services         │   │
│  └──────────────────────────┬───────────────────────────┘   │
│                              │                               │
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │                   AI Gateway                           │  │
│  │   Gemini → Groq → OpenRouter  (automatic failover)    │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │  Celery task queue  ←─  Redis broker                   │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                      PostgreSQL                              │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Principles

### Thin views, fat services

All business logic lives in `services.py` within each app module. Views are responsible only for:

1. Deserialising and validating the request body (via DRF serializers)
2. Calling the appropriate service method
3. Serialising and returning the response

This keeps views testable in isolation and makes service logic reusable across views and Celery tasks.

### AI layer isolation

All AI provider interaction is routed through the `AIGateway` in `backend/ai/`. No app-level view or service calls a provider SDK directly. This ensures:

- Provider failover is transparent to feature code
- Prompt injection checks apply uniformly to all AI calls
- Provider health monitoring is centralised

### Ownership at the database level

Every user-owned resource (notes, quizzes, plans, etc.) stores a `user` foreign key. Service methods always filter by `user=request.user` before returning or mutating data. There is no reliance on URL-level ownership checks alone.

## Module Boundaries

| Module | Responsibility | Owns models |
|--------|---------------|-------------|
| `accounts` | Auth, user profiles, JWT | `User`, `UserProfile`, `EmailVerificationToken` |
| `planner` | Study plan generation and session scheduling | `StudyPlan`, `StudySession` |
| `notes` | Rich notes, AI summaries, flashcard generation | `Note`, `Flashcard` |
| `quizzes` | Quiz generation, attempt tracking, AI feedback | `Quiz`, `Question`, `QuizAttempt` |
| `chatbot` | Conversation management, SSE streaming | `Conversation`, `Message` |
| `revision` | Spaced-repetition topic tracking | `RevisionTopic`, `RevisionLog` |
| `goals` | Learning goal management | `Goal` |
| `productivity` | Pomodoro sessions, focus logs, streak calculation | `PomodoroSession`, `FocusLog` |
| `pdfs` | PDF upload and AI-assisted querying | `PDFDocument` |
| `analytics` | Cross-module study trend queries | none |
| `dashboard` | Aggregated summary view | none |
| `notifications` | In-app alert creation and delivery | `Notification` |
| `subscriptions` | Subscription and plan management | `Subscription` |

## Request Lifecycle

```
1. Request arrives at Django
2. CorsMiddleware — validates origin
3. JWTAuthentication — decodes Bearer token, sets request.user
4. View.dispatch → View method (get/post/patch/delete)
5. Serializer.is_valid() — validates and deserialises body
6. Service method — executes business logic
   └── If AI needed: AIGateway.method() → Provider → response
   └── If async needed: task.delay() → Celery → Redis
7. Response serializer — serialises result
8. success_response() / error_response() — wraps in standard envelope
9. JSON response returned
```

## Data Flow: AI Features

```
Request body
    │
    ▼
Serializer validates input fields
    │
    ▼
Service builds prompt (using template from services/ai_engine/prompts/)
    │
    ▼
AIGateway.generate_json() / .chat() / .stream_chat()
    │
    ├── Prompt injection check (blocks if detected)
    ├── Try Gemini provider
    ├── On failure → try Groq provider
    └── On failure → try OpenRouter provider
    │
    ▼
Response parsed and returned to service
    │
    ▼
Service maps AI output to domain objects / saves to DB
    │
    ▼
View returns structured response
```
