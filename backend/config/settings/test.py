"""
Test settings for BrainPilot-AI.

Overrides production settings for testing environment.
"""

from .production import *

DEBUG = True

# Database
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "brainpilot_test",
        "USER": "brainpilot",
        "PASSWORD": "testpassword",
        "HOST": "localhost",
        "PORT": "5432",
    }
}

# Celery - run tasks synchronously in tests
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Email backend - use console backend for tests
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Disable debug toolbar in tests
INSTALLED_APPS = [
    app for app in INSTALLED_APPS if app != "debug_toolbar"
]

# Faster password hashing for tests
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# Disable security features for tests
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "WARNING",
    },
}
