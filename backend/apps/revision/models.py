from django.db import models
from django.conf import settings
from common.base_models import BaseModel


class RevisionTopic(BaseModel):
    class Confidence(models.IntegerChoices):
        VERY_LOW = 1, "Very Low"
        LOW = 2, "Low"
        MEDIUM = 3, "Medium"
        HIGH = 4, "High"
        VERY_HIGH = 5, "Very High"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="revision_topics")
    subject = models.CharField(max_length=255)
    topic = models.CharField(max_length=255)
    confidence_level = models.IntegerField(choices=Confidence.choices, default=Confidence.MEDIUM)
    revision_count = models.PositiveSmallIntegerField(default=0)
    last_revised_at = models.DateTimeField(blank=True, null=True)
    next_revision_at = models.DateTimeField(blank=True, null=True, db_index=True)
    is_weak = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "revision_topics"
        ordering = ["next_revision_at"]
        unique_together = [["user", "subject", "topic"]]
        indexes = [
            models.Index(fields=["user", "is_weak"]),
            models.Index(fields=["user", "subject"]),
        ]

    def __str__(self):
        return f"{self.subject} - {self.topic}"


class RevisionSession(BaseModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="revision_sessions")
    topic = models.ForeignKey(RevisionTopic, on_delete=models.CASCADE, related_name="sessions")
    duration_minutes = models.PositiveSmallIntegerField()
    confidence_before = models.IntegerField()
    confidence_after = models.IntegerField()
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "revision_sessions"
        ordering = ["-created_at"]
