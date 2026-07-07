import os
from pathlib import Path
from django.core.exceptions import ImproperlyConfigured


def validate_environment():
    """Validate that required environment variables are set in production."""
    # Skip validation in development - check if we're in dev mode
    # Development typically uses SQLite and default settings
    is_development = (
        os.environ.get("DEBUG", "False") == "True" or
        os.environ.get("DJANGO_SETTINGS_MODULE", "").endswith("development")
    )
    
    if is_development:
        return
    
    required_vars = {
        "DJANGO_SECRET_KEY": "Django secret key",
        "DATABASE_URL": "Database connection URL",
        "GEMINI_API_KEY": "Google Gemini API key",
    }
    
    optional_vars = {
        "REDIS_URL": "Redis connection URL",
        "EMAIL_HOST": "Email server host",
        "EMAIL_HOST_USER": "Email server username",
        "EMAIL_HOST_PASSWORD": "Email server password",
    }
    
    missing_required = []
    missing_optional = []
    
    for var_name, description in required_vars.items():
        if not os.environ.get(var_name):
            missing_required.append(f"{var_name} ({description})")
    
    for var_name, description in optional_vars.items():
        if not os.environ.get(var_name):
            missing_optional.append(f"{var_name} ({description})")
    
    if missing_required:
        raise ImproperlyConfigured(
            f"Missing required environment variables:\n" + 
            "\n".join(f"  - {var}" for var in missing_required)
        )
    
    if missing_optional:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(
            "Missing optional environment variables:\n" + 
            "\n".join(f"  - {var}" for var in missing_optional)
        )


# Validate environment on import
validate_environment()
