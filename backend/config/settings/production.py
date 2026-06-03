import os
from .base import *

DEBUG = False

# Comma-separated list of allowed hostnames, e.g. "api.example.com,www.example.com"
ALLOWED_HOSTS = [h.strip() for h in os.environ.get("ALLOWED_HOSTS", "").split(",") if h.strip()]

# Support additional hosts injected by the hosting platform at runtime
_platform_domains = os.environ.get("PLATFORM_DOMAINS", "") or os.environ.get("REPLIT_DOMAINS", "")
if _platform_domains:
    ALLOWED_HOSTS += [d.strip() for d in _platform_domains.split(",") if d.strip()]

# Comma-separated list of allowed CORS origins, e.g. "https://app.example.com"
CORS_ALLOWED_ORIGINS = [
    o.strip() for o in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",") if o.strip()
]

# Support additional CORS origins injected by the hosting platform at runtime
_platform_dev_domain = os.environ.get("PLATFORM_DEV_DOMAIN", "") or os.environ.get("REPLIT_DEV_DOMAIN", "")
if _platform_dev_domain:
    CORS_ALLOWED_ORIGINS += [
        f"https://{_platform_dev_domain}",
        f"http://{_platform_dev_domain}",
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

# Limit upload body size to 10 MB to prevent large-payload DoS
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024

# Static files via WhiteNoise
MIDDLEWARE = ["whitenoise.middleware.WhiteNoiseMiddleware"] + MIDDLEWARE
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Production: file + console logging (write to /tmp to avoid permission issues)
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {asctime} {message}",
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
