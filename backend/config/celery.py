import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("brainpilot")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

app.conf.beat_schedule = {
    "send-revision-reminders": {
        "task": "services.ai_engine.tasks.ai_tasks.send_revision_reminders",
        "schedule": crontab(hour=8, minute=0),
    },
}
