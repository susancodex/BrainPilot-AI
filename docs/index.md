# BrainPilot AI — Documentation

Welcome to the BrainPilot AI documentation. Use the links below to navigate to the section you need.

## Contents

### Architecture
- [System overview](architecture/overview.md) — High-level architecture, request lifecycle, and module boundaries

### Backend
- [API reference](backend/api-reference.md) — All REST endpoints with request/response examples
- [Authentication](backend/authentication.md) — JWT flow, token lifecycle, account security

### AI
- [AI gateway & agents](ai-agents/overview.md) — Multi-provider failover, prompt security, workflows

### Frontend
- [Component guide](frontend/component-guide.md) — Architecture conventions, hooks, routing, SSE

### Database
- [Schema reference](database/schema.md) — Tables, common patterns, migrations

### Deployment
- [Deployment guide](deployment/guide.md) — Docker Compose, Render.com, manual VPS

### Security
- [Security practices](security/practices.md) — Auth, rate limiting, input validation, headers

### Testing
- [Testing guide](testing/guide.md) — pytest setup, fixtures, coverage requirements

---

For the full API reference with interactive request/response schemas, start the backend and visit:
- **Swagger UI**: `http://localhost:8000/api/v1/schema/swagger-ui/`
- **ReDoc**: `http://localhost:8000/api/v1/schema/redoc/`
