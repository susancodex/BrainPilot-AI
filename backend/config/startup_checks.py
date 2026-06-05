"""
Startup environment validation.

Called from AppConfig.ready() in production to fail fast if required
environment variables are missing or obviously wrong.
"""
import os
import sys
import logging

logger = logging.getLogger(__name__)

REQUIRED_IN_PRODUCTION = [
    "DJANGO_SECRET_KEY",
    "DATABASE_URL",
]

INSECURE_SECRET_KEY_PREFIXES = [
    "dev-secret",
    "change-me",
    "your-secret",
    "insecure",
]


def run() -> None:
    """Validate the environment. Exits the process if a blocker is found."""
    from django.conf import settings

    if not settings.DEBUG:
        _check_required_vars()
        _check_secret_key(settings.SECRET_KEY)
        _check_database_url()
        logger.info("Startup checks passed.")
    else:
        logger.debug("Startup checks skipped in DEBUG mode.")


def _check_required_vars() -> None:
    missing = [var for var in REQUIRED_IN_PRODUCTION if not os.environ.get(var)]
    if missing:
        _abort(
            f"Missing required environment variable(s): {', '.join(missing)}. "
            "Set them before starting the server."
        )

    if not any(
        os.environ.get(var, "").strip()
        for var in ("GEMINI_API_KEY", "GROQ_API_KEY", "OPENROUTER_API_KEY")
    ):
        _abort(
            "No AI provider key is configured. Set GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY."
        )


def _check_secret_key(key: str) -> None:
    if len(key) < 40:
        _abort("DJANGO_SECRET_KEY is too short (minimum 40 characters).")
    for prefix in INSECURE_SECRET_KEY_PREFIXES:
        if key.lower().startswith(prefix):
            _abort(
                f"DJANGO_SECRET_KEY looks like a placeholder (starts with '{prefix}'). "
                "Generate a strong key before deploying."
            )


def _check_database_url() -> None:
    url = os.environ.get("DATABASE_URL", "")
    if url and "localhost" in url and not os.environ.get("ALLOW_LOCAL_DB"):
        logger.warning(
            "DATABASE_URL points to localhost in a production environment. "
            "Set ALLOW_LOCAL_DB=1 to suppress this warning."
        )


def _abort(message: str) -> None:
    logger.critical("STARTUP CHECK FAILED: %s", message)
    sys.exit(1)
