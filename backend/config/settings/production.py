import os
from .base import *

DEBUG = False

REQUIRE_EMAIL_VERIFICATION = (
    os.environ.get("REQUIRE_EMAIL_VERIFICATION", "true").lower() == "true"
)

# Comma-separated list of allowed hostnames, e.g. "api.example.com,www.example.com"
ALLOWED_HOSTS = [h.strip() for h in os.environ.get("ALLOWED_HOSTS", "").split(",") if h.strip()]

# Render auto-injects this; production.py reads it so ALLOWED_HOSTS needs no manual config.
_render_host = os.environ.get("RENDER_EXTERNAL_HOSTNAME", "").strip()
if _render_host and _render_host not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(_render_host)

# Comma-separated list of allowed CORS origins, e.g. "https://app.example.com"
CORS_ALLOWED_ORIGINS = [
    o.strip() for o in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",") if o.strip()
]
# Allow the Render public hostname automatically
if _render_host:
    _render_origin = f"https://{_render_host}"
    if _render_origin not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(_render_origin)

CORS_ALLOWED_ORIGIN_REGEXES = []

# Security headers
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

# Match PDF upload limit in apps/pdfs/serializers.py (20 MB)
DATA_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024

# ── Caching ───────────────────────────────────────────────────────────────────
# Use Redis when REDIS_URL is provided (paid tier), otherwise fall back to
# in-process memory cache (free tier — no persistence across restarts).
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
    # Free tier / no Redis — tasks already run eagerly via CELERY_ALWAYS_EAGER
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }

# ── Celery (eager mode on free tier when no Redis broker) ─────────────────────
if os.environ.get("CELERY_ALWAYS_EAGER", "false").lower() == "true":
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_TASK_EAGER_PROPAGATES = True

# ── Static files via WhiteNoise ───────────────────────────────────────────────
# Insert WhiteNoise directly after SecurityMiddleware (position 1).
_security_idx = next(
    (i for i, m in enumerate(MIDDLEWARE) if "SecurityMiddleware" in m), 0
)
MIDDLEWARE = (
    MIDDLEWARE[: _security_idx + 1]
    + ["whitenoise.middleware.WhiteNoiseMiddleware"]
    + MIDDLEWARE[_security_idx + 1 :]
)

# STORAGES replaces the deprecated STATICFILES_STORAGE setting (Django 4.2+)
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# ── Email ─────────────────────────────────────────────────────────────────────
# Fall back to console backend if SMTP credentials are not configured.
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
