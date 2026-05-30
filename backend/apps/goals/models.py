from django.db import models
from django.conf import settings
from common.base_models import BaseModel


class Goal(BaseModel):
    class Category(models.TextChoices):
        ACADEMIC = "academic", "Academic"
        SKILL = "skill", "Skill"
        CERTIFICATION = "certification", "Certification"
        EXAM = "exam", "Exam"
        PERSONAL = "personal", "Personal"

    class Status(models.TextChoices):
        NOT_STARTED = "not_started", "Not Started"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        ABANDONED = "abandoned", "Abandoned"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="goals")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=30, choices=Category.choices, default=Category.ACADEMIC)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NOT_STARTED)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    target_date = models.DateField(blank=True, null=True)
    progress = models.PositiveSmallIntegerField(default=0)
    milestones = models.JSONField(default=list)

    class Meta:
        db_table = "goals_goals"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "status", "priority"])]

    def __str__(self):
        return f"{self.user.email} - {self.title}"


class GoalMilestone(BaseModel):
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name="milestone_items")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateField(blank=True, null=True)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "goals_milestones"
        ordering = ["due_date"]
