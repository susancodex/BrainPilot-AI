import os
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from .base import *

# ── Sentry Error Tracking ───────────────────────────────────────────────────────
# Configure Sentry for error monitoring in production
sentry_dsn = os.environ.get("SENTRY_DSN", "").strip()
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        integrations=[
            DjangoIntegration(),
            CeleryIntegration(),
        ],
        traces_sample_rate=0.1,  # 10% of transactions for performance monitoring
        profiles_sample_rate=0.1,  # 10% of profiles for performance monitoring
        environment=os.environ.get("SENTRY_ENVIRONMENT", "production"),
        send_default_pii=False,
    )

DEBUG = False

REQUIRE_EMAIL_VERIFICATION = (
    os.environ.get("REQUIRE_EMAIL_VERIFICATION", "true").lower() == "true"
)

# ── Allowed hosts ─────────────────────────────────────────────────────────────
# Comma-separated: ALLOWED_HOSTS=api.example.com,www.example.com
ALLOWED_HOSTS = [h.strip() for h in os.environ.get("ALLOWED_HOSTS", "").split(",") if h.strip()]

# Render auto-injects RENDER_EXTERNAL_HOSTNAME — no manual config needed.
_render_host = os.environ.get("RENDER_EXTERNAL_HOSTNAME", "").strip()
if _render_host and _render_host not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(_render_host)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Comma-separated: CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
CORS_ALLOWED_ORIGINS = [
    o.strip() for o in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",") if o.strip()
]
CORS_ALLOWED_ORIGIN_REGEXES = []

# ── CSRF ──────────────────────────────────────────────────────────────────────
# Comma-separated list of trusted origins for CSRF protection.
# Must include every origin that submits forms/POST requests (e.g. your Vercel URL).
# Example: CSRF_TRUSTED_ORIGINS=https://your-app.vercel.app,https://brainpilot-api.onrender.com
CSRF_TRUSTED_ORIGINS = [
    o.strip() for o in os.environ.get("CSRF_TRUSTED_ORIGINS", "").split(",") if o.strip()
]
if _render_host:
    _render_origin = f"https://{_render_host}"
    if _render_origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(_render_origin)
    if _render_origin not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(_render_origin)

# ── Security headers ──────────────────────────────────────────────────────────
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = os.environ.get("SECURE_SSL_REDIRECT", "false").lower() == "true"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# ── Upload limits (match apps/pdfs/serializers.py — 20 MB) ───────────────────
DATA_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024

# ── Database Connection Pooling ───────────────────────────────────────────────
# Configure connection pooling for Neon PostgreSQL
DATABASES = {
    "default": dj_database_url.config(
        default=os.environ.get("DATABASE_URL", ""),
        conn_max_age=600,
        conn_health_checks=True,
        options={
            "sslmode": "require",
        },
    )
}

# ── Caching ───────────────────────────────────────────────────────────────────
# Use Redis when REDIS_URL is set (paid tier), otherwise use in-process LocMemCache
# (free tier — no cross-worker persistence, tasks already run eagerly).
_redis_url = os.environ.get("REDIS_URL", "").strip()
if _redis_url:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": _redis_url,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
                "SOCKET_CONNECT_TIMEOUT": 5,
                "SOCKET_TIMEOUT": 5,
            },
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }

# ── Celery (asynchronous by default in production) ─────────────────────────────
# Use external Redis/RabbitMQ for async tasks
# Set REDIS_URL to your Upstash Redis or CloudAMQP RabbitMQ instance
_redis_broker = os.environ.get("REDIS_URL", "").strip()
if _redis_broker:
    CELERY_BROKER_URL = _redis_broker
    CELERY_RESULT_BACKEND = _redis_broker
    CELERY_TASK_ALWAYS_EAGER = False
    CELERY_TASK_EAGER_PROPAGATES = False
else:
    # Fallback to eager mode if no external broker is configured
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_TASK_EAGER_PROPAGATES = True

# ── Static files via WhiteNoise ───────────────────────────────────────────────
# Insert WhiteNoise directly after SecurityMiddleware, as required by WhiteNoise docs.
_security_idx = next(
    (i for i, m in enumerate(MIDDLEWARE) if "SecurityMiddleware" in m), 0
)
MIDDLEWARE = (
    MIDDLEWARE[: _security_idx + 1]
    + ["whitenoise.middleware.WhiteNoiseMiddleware"]
    + MIDDLEWARE[_security_idx + 1 :]
)

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# ── Email ─────────────────────────────────────────────────────────────────────
# Fall back to console backend when SMTP credentials are not configured.
if os.environ.get("EMAIL_HOST_USER", "").strip():
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ── Logging ───────────────────────────────────────────────────────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "level={levelname} time={asctime} logger={name} module={module} message={message}",
            "style": "{",
        },
        "simple": {
            "format": "level={levelname} time={asctime} logger={name} message={message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "django.db.backends": {"handlers": ["console"], "level": "WARNING", "propagate": False},
        "apps": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "services": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
}
