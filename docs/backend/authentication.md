# Authentication

BrainPilot uses JWT-based authentication implemented with `djangorestframework-simplejwt`.

## Token Lifecycle

```
POST /api/v1/auth/login/
    → { access: "...", refresh: "..." }

Access token lifetime:  60 minutes
Refresh token lifetime: 7 days
```

On each token refresh, the previous refresh token is blacklisted (rotation). This means a stolen refresh token can only be used once before it is invalidated.

## Endpoints

### Register

```http
POST /api/v1/auth/register/
Content-Type: application/json

{
  "email": "student@example.com",
  "first_name": "Alice",
  "last_name": "Smith",
  "password": "MyPassword123!",
  "password_confirm": "MyPassword123!"
}
```

Returns `201 Created` with the created user object. In production, a verification email is sent before the account can log in. In development (`DEBUG=True`), verification is skipped automatically.

### Login

```http
POST /api/v1/auth/login/
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "MyPassword123!"
}
```

Returns `200 OK`:

```json
{
  "status": "success",
  "data": {
    "access": "<jwt-access-token>",
    "refresh": "<jwt-refresh-token>",
    "user": { "id": "...", "email": "...", "first_name": "...", ... }
  }
}
```

### Refresh

```http
POST /api/v1/token/refresh/
Content-Type: application/json

{
  "refresh": "<refresh-token>"
}
```

Returns a new access/refresh pair. The old refresh token is blacklisted immediately.

### Logout

```http
POST /api/v1/auth/logout/
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "refresh": "<refresh-token>"
}
```

Blacklists the refresh token, preventing further refreshes.

## Using the Access Token

Include it in every authenticated request:

```http
Authorization: Bearer <access-token>
```

## Account Lockout

After **5 consecutive failed login attempts**, the account is locked for **15 minutes**. The lockout applies to the account, not the IP address.

## Password Requirements

- Minimum 8 characters
- Cannot be entirely numeric
- Cannot be too similar to email or name
- Cannot be a commonly used password

## Password Reset

```http
# 1. Request reset link
POST /api/v1/auth/password/reset/
{ "email": "student@example.com" }

# 2. Confirm reset with token from email
POST /api/v1/auth/password/reset/confirm/
{ "token": "<reset-token>", "new_password": "NewPassword123!" }
```

## Response Envelope

All API responses follow a standard envelope:

```json
{
  "status": "success" | "error",
  "message": "Human-readable message",
  "data": { ... }
}
```

Error responses include a `errors` field with field-level validation messages.
