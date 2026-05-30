from django.db import models
from django.conf import settings
from common.base_models import BaseModel


class Notification(BaseModel):
    class Type(models.TextChoices):
        REVISION_DUE = "revision_due", "Revision Due"
        EXAM_ALERT = "exam_alert", "Exam Alert"
        GOAL_REMINDER = "goal_reminder", "Goal Reminder"
        AI_RECOMMENDATION = "ai_recommendation", "AI Recommendation"
        PLAN_REMINDER = "plan_reminder", "Plan Reminder"
        STREAK_ALERT = "streak_alert", "Streak Alert"
        ACHIEVEMENT = "achievement", "Achievement"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=30, choices=Type.choices)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)
    action_url = models.CharField(max_length=500, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "notifications_notifications"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "is_read", "type"])]

    def __str__(self):
        return f"{self.user.email} - {self.title}"
