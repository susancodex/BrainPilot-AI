import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")

application = get_wsgi_application()

# Run production environment checks after the application is ready.
# Exits the process immediately if required variables are missing.
if os.environ.get("DJANGO_SETTINGS_MODULE", "").endswith(".production"):
    from config.startup_checks import run as _run_startup_checks
    _run_startup_checks()
