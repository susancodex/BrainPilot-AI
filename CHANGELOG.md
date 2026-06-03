# Changelog

All notable changes to BrainPilot AI are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Subscription and billing management
- Team/cohort study rooms
- Mobile application (React Native)
- Export study plans to calendar formats (iCal, Google Calendar)

---

## [1.0.0] — 2026-06-03

### Added

**Core Platform**
- Django 6 + Django REST Framework backend with 13 feature applications
- React 19 + Vite 7 + Tailwind CSS 4 frontend
- JWT authentication with access/refresh token rotation and token blacklisting
- Account lockout after 5 consecutive failed login attempts
- Rate limiting: 30 req/min (anonymous), 120 req/min (authenticated), 10 req/min (auth endpoints)

**AI Gateway**
- Multi-provider failover: Gemini (primary) → Groq → OpenRouter
- Provider health monitoring with automatic 5-minute cooldown on repeated failures
- Prompt injection detection blocking common jailbreak patterns
- `/api/v1/ai/health/` endpoint for live provider status and latency metrics

**Study Features**
- AI-generated study plans with spaced-repetition scheduling
- Rich-text notes with AI summarisation and flashcard generation
- AI quiz generation (MCQ, True/False, short-answer) with personalised coaching feedback
- Spaced-repetition flashcard review system with difficulty tracking
- Revision topic management surfacing weak areas
- Learning goals with progress tracking

**Productivity**
- Pomodoro timer with configurable work/break durations
- Focus log tracking and study streak calculation
- Dashboard summary aggregating all active study data

**Communication**
- Real-time AI chatbot with SSE word-by-word streaming
- Conversation history and multi-turn memory
- In-app notification system

**Infrastructure**
- Docker and Docker Compose configuration for self-hosted deployment
- Render.com deployment configuration (`render.yaml`)
- Celery task queue with Redis broker (synchronous fallback in development)
- WhiteNoise static file serving for production
- OpenAPI 3.1 schema with Swagger UI and ReDoc
- Structured JSON logging with rotating file handlers in production

---

[Unreleased]: https://github.com/your-org/brainpilot/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/your-org/brainpilot/releases/tag/v1.0.0
