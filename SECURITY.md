# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x (latest) | ✅ |
| < 1.0 | ❌ |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Send a report to **security@brainpilot.ai** with:

1. A description of the vulnerability and its potential impact
2. Steps to reproduce the issue
3. Any proof-of-concept code or screenshots
4. Your name/handle for acknowledgement (optional)

You will receive an acknowledgement within **48 hours** and a detailed response within **7 days** indicating whether the report has been accepted or declined. If accepted, we will work with you on a timeline for disclosure.

We ask that you:

- Give us reasonable time to fix the issue before public disclosure
- Avoid accessing or modifying user data without consent
- Not perform denial-of-service attacks

## Security Measures

### Authentication & Authorisation

- JWT access tokens expire after 60 minutes
- Refresh tokens rotate on every use and are blacklisted after rotation
- Passwords hashed with PBKDF2-SHA256 (100,000 iterations via Django's default hasher)
- Account lockout after 5 consecutive failed login attempts (15-minute lockout)
- All API endpoints require authentication except auth and health routes

### Rate Limiting

- Anonymous requests: 30 req/min
- Authenticated requests: 120 req/min
- Auth endpoints: 10 req/min

### Input Validation

- All request bodies validated through DRF serializers before reaching service layer
- AI prompt injection patterns detected and blocked before any provider call
- Maximum prompt length enforced (50,000 characters)

### Transport & Headers (production)

- HTTPS enforced via `SECURE_SSL_REDIRECT`
- HSTS enabled with 1-year max-age and subdomain inclusion
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection` header set
- CSRF protection active on all mutating endpoints

### Database

- Parameterised queries via Django ORM — no raw SQL string interpolation
- Row-level ownership checks on all user-owned resources
- Connection pooling with health checks

### Dependencies

- Backend dependencies pinned in `requirements/` files
- Frontend dependencies locked in `pnpm-lock.yaml`
- Automated dependency scanning via GitHub Actions (see `.github/workflows/security.yml`)

## Acknowledgements

We appreciate all responsible disclosure reports and will acknowledge contributors in our changelog unless they prefer to remain anonymous.
