from django.db import models
from django.conf import settings
from common.base_models import BaseModel


class StudyPlan(BaseModel):
    class PlanType(models.TextChoices):
        DAILY = "daily", "Daily"
        WEEKLY = "weekly", "Weekly"
        MONTHLY = "monthly", "Monthly"
        EMERGENCY = "emergency", "Emergency Exam Mode"
        CUSTOM = "custom", "Custom"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        PAUSED = "paused", "Paused"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="study_plans")
    title = models.CharField(max_length=255)
    plan_type = models.CharField(max_length=20, choices=PlanType.choices, default=PlanType.DAILY)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    subjects = models.JSONField(default=list)
    start_date = models.DateField()
    end_date = models.DateField()
    total_hours = models.PositiveSmallIntegerField(default=0)
    ai_generated = models.BooleanField(default=False)
    ai_context = models.JSONField(default=dict, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "planner_study_plans"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["user", "start_date"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.title}"


class StudySession(BaseModel):
    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        SKIPPED = "skipped", "Skipped"
        RESCHEDULED = "rescheduled", "Rescheduled"

    plan = models.ForeignKey(StudyPlan, on_delete=models.CASCADE, related_name="sessions")
    subject = models.CharField(max_length=255)
    topic = models.CharField(max_length=255)
    scheduled_date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    duration_minutes = models.PositiveSmallIntegerField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    completion_percentage = models.PositiveSmallIntegerField(default=0)
    notes = models.TextField(blank=True)
    rescheduled_to = models.DateField(blank=True, null=True)

    class Meta:
        db_table = "planner_study_sessions"
        ordering = ["scheduled_date", "start_time"]
        indexes = [
            models.Index(fields=["plan", "scheduled_date"]),
            models.Index(fields=["plan", "status"]),
        ]

    def __str__(self):
        return f"{self.subject} - {self.scheduled_date}"
