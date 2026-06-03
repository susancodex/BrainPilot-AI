# Changelog

All notable changes to BrainPilot AI are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Subscription and billing integration
- Mobile-responsive layout improvements
- Collaborative study groups
- Calendar sync (Google Calendar / Apple Calendar)
- Offline flashcard review mode

---

## [1.0.0] — 2026-06-03

### Added

**AI Features**
- Multi-provider AI gateway with automatic failover: Gemini → Groq → OpenRouter
- Provider health monitoring with 5-minute cooldown after 3 consecutive failures
- Prompt injection detection blocking adversarial inputs before any API call
- Live provider health endpoint: `GET /api/v1/ai/health/`

**Study Planner**
- AI-generated daily/weekly study plans from subject list, dates, and optional syllabus
- PDF syllabus upload with server-side text extraction
- Per-session status tracking (pending / in-progress / completed / skipped)

**Notes & Flashcards**
- Rich-text note editor (Tiptap) with heading, bold, italic, code blocks, lists, and links
- AI note summarisation
- One-click AI flashcard generation from note content
- Spaced-repetition review scheduling (SM-2 inspired difficulty scoring)
- Flashcard due-date queue endpoint

**Quizzes**
- AI-generated MCQ, true/false, and short-answer quizzes
- Per-attempt AI coaching feedback with subject-specific guidance
- Quiz attempt history

**AI Chatbot**
- Persistent conversation history
- Full JSON response mode
- Server-Sent Events (SSE) streaming mode (word-by-word)

**Revision Tracker**
- Revision topic logging with proficiency scoring
- Weak-topic detection endpoint
- Due-topic queue

**Productivity**
- Pomodoro session management
- Focus log entries
- Study streak tracking

**Analytics**
- Study trend analysis over configurable time ranges
- Per-subject breakdown
- Full performance report

**Authentication & Accounts**
- Email + password registration with email verification
- JWT access tokens (60-minute lifetime) with refresh token rotation
- Token blacklisting on logout
- Account lockout after 5 failed login attempts
- Password reset via email link
- User profile with avatar, academic level, institution, and study preferences

**Infrastructure**
- Django 6 + Django REST Framework backend
- React 19 + Vite 7 + Tailwind CSS 4 frontend
- PostgreSQL database with connection pooling
- Celery task queue (synchronous in development, Redis-backed in production)
- drf-spectacular OpenAPI 3.1 docs with Swagger UI and ReDoc
- Docker + Docker Compose for local and production deployments
- Render deployment blueprint
- WhiteNoise for production static file serving

[Unreleased]: https://github.com/your-org/brainpilot/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/your-org/brainpilot/releases/tag/v1.0.0
