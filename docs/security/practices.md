# Security Practices

## Authentication & Tokens

### JWT configuration

| Setting | Value |
|---------|-------|
| Access token lifetime | 60 minutes |
| Refresh token lifetime | 7 days |
| Algorithm | HS256 |
| Rotation on refresh | Yes — old refresh token is blacklisted immediately |
| Blacklist on logout | Yes |

Refresh token rotation means a stolen refresh token can only be used once before it is permanently invalidated.

### Account lockout

After **5 consecutive failed login attempts**, the account is locked for **15 minutes**. This is independent of IP address and applies to the account itself.

## Password Security

- Minimum 8 characters enforced at the serialiser level
- Django's built-in validators: `UserAttributeSimilarityValidator`, `MinimumLengthValidator`, `CommonPasswordValidator`, `NumericPasswordValidator`
- Passwords stored using PBKDF2-SHA256 with 100,000 iterations (Django default)
- Password reset tokens are single-use and expire after 2 hours

## Input Validation

All request bodies are validated through DRF serialisers before the service layer is invoked. No raw request data reaches the database.

### AI prompt security

Every prompt is validated in `AIGateway._validate_prompt()` before being sent to any provider:

- **Length limit**: 50,000 characters maximum
- **Injection patterns** (all case-insensitive):
  - `ignore (all) (previous|prior|above) instructions`
  - `disregard (all) (previous|prior) instructions`
  - `you are now [a/an] <something>`
  - `forget everything (you know|before)`
  - `reveal (your|the) (system) prompt`

A `PromptValidationError` is raised (HTTP 400) if any pattern matches.

## Authorisation

Every endpoint that returns or modifies user-owned data filters by `user=request.user`. Ownership is enforced at the service layer, not just the URL level. A user cannot access another user's data by guessing a UUID.

## HTTP Security Headers (production)

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `same-origin` |

These are configured in `backend/config/settings/production.py`.

## CORS

Production CORS is configured via the `CORS_ALLOWED_ORIGINS` environment variable. CORS is not a substitute for authentication — all API endpoints still require a valid JWT regardless of origin.

## Database Security

- All database queries use the Django ORM with parameterised queries — no raw SQL string interpolation
- `DATABASE_URL` is read from the environment and never hardcoded
- Connection health checks are enabled to detect stale connections early

## Rate Limiting

Implemented via `django-ratelimit`:

| Scope | Rate |
|-------|------|
| Anonymous | 30 req/min |
| Authenticated | 120 req/min |
| Auth endpoints | 10 req/min |

## Dependency Management

- Backend dependencies are pinned in `requirements/base.txt`, `requirements/production.txt`
- Frontend dependencies are locked in `pnpm-lock.yaml`
- GitHub Actions runs automated dependency audits weekly (see `.github/workflows/security.yml`)

## Reporting Vulnerabilities

See [SECURITY.md](../../SECURITY.md) for the responsible disclosure process.
