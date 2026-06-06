import os
from .base import *

DEBUG = False

REQUIRE_EMAIL_VERIFICATION = (
    os.environ.get("REQUIRE_EMAIL_VERIFICATION", "true").lower() == "true"
)

# Comma-separated list of allowed hostnames, e.g. "api.example.com,www.example.com"
ALLOWED_HOSTS = [h.strip() for h in os.environ.get("ALLOWED_HOSTS", "").split(",") if h.strip()]

_render_host = os.environ.get("RENDER_EXTERNAL_HOSTNAME", "").strip()
if _render_host and _render_host not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(_render_host)

# Comma-separated list of allowed CORS origins, e.g. "https://app.example.com"
CORS_ALLOWED_ORIGINS = [
    o.strip() for o in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",") if o.strip()
]

# Allow any subdomain of your production domains (add regexes as needed)
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

# Static files via WhiteNoise
# Insert WhiteNoise directly after SecurityMiddleware (position 1), as required by WhiteNoise docs.
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

# Allow running without Celery workers by executing tasks inline.
# Set CELERY_ALWAYS_EAGER=true on the web service if you skip the worker.
if os.environ.get("CELERY_ALWAYS_EAGER", "false").lower() == "true":
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_TASK_EAGER_PROPAGATES = True

# Production: file + console logging (write to /tmp to avoid permission issues)
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "level={levelname} time={asctime} logger={name} module={module} process={process:d} thread={thread:d} message={message}",
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
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "/tmp/brainpilot.log",
            "maxBytes": 1024 * 1024 * 10,
            "backupCount": 3,
            "formatter": "verbose",
        },
        "error_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "/tmp/brainpilot_error.log",
            "maxBytes": 1024 * 1024 * 10,
            "backupCount": 3,
            "formatter": "verbose",
            "level": "ERROR",
        },
    },
    "root": {
        "handlers": ["console", "file"],
        "level": "INFO",
    },
    "loggers": {
        "django": {"handlers": ["console", "file"], "level": "INFO", "propagate": False},
        "django.db.backends": {"handlers": ["console"], "level": "WARNING", "propagate": False},
        "apps": {"handlers": ["console", "file", "error_file"], "level": "INFO", "propagate": False},
        "services": {"handlers": ["console", "file", "error_file"], "level": "INFO", "propagate": False},
    },
}
