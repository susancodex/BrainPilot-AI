from django.db import models
from django.conf import settings
from common.base_models import BaseModel


class PomodoroSession(BaseModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        ABANDONED = "abandoned", "Abandoned"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="pomodoro_sessions")
    subject = models.CharField(max_length=255)
    task_description = models.TextField(blank=True)
    work_duration_minutes = models.PositiveSmallIntegerField(default=25)
    break_duration_minutes = models.PositiveSmallIntegerField(default=5)
    pomodoros_completed = models.PositiveSmallIntegerField(default=0)
    pomodoros_planned = models.PositiveSmallIntegerField(default=4)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(blank=True, null=True)
    total_focus_minutes = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "productivity_pomodoro_sessions"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "status"])]


class StudyStreak(BaseModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="study_streak")
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    last_study_date = models.DateField(blank=True, null=True)
    total_study_days = models.PositiveIntegerField(default=0)
    streak_history = models.JSONField(default=list)

    class Meta:
        db_table = "productivity_study_streaks"


class FocusLog(BaseModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="focus_logs")
    pomodoro_session = models.ForeignKey(PomodoroSession, on_delete=models.SET_NULL, null=True, blank=True, related_name="focus_logs")
    date = models.DateField(db_index=True)
    focus_minutes = models.PositiveSmallIntegerField(default=0)
    productivity_score = models.FloatField(default=0)
    subjects_studied = models.JSONField(default=list)

    class Meta:
        db_table = "productivity_focus_logs"
        ordering = ["-date"]
        unique_together = [["user", "date"]]
