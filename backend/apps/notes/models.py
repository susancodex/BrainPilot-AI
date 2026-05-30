from django.db import models
from django.conf import settings
from common.base_models import BaseModel


class Note(BaseModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notes")
    title = models.CharField(max_length=500)
    content = models.TextField()
    subject = models.CharField(max_length=255, blank=True)
    tags = models.JSONField(default=list)
    is_pinned = models.BooleanField(default=False)
    ai_summary = models.TextField(blank=True)
    summary_generated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "notes_notes"
        ordering = ["-is_pinned", "-created_at"]
        indexes = [
            models.Index(fields=["user", "subject"]),
            models.Index(fields=["user", "is_pinned"]),
        ]

    def __str__(self):
        return self.title


class Flashcard(BaseModel):
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name="flashcards", blank=True, null=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="flashcards")
    question = models.TextField()
    answer = models.TextField()
    subject = models.CharField(max_length=255, blank=True)
    difficulty = models.CharField(
        max_length=20,
        choices=[("easy", "Easy"), ("medium", "Medium"), ("hard", "Hard")],
        default="medium",
    )
    times_reviewed = models.PositiveSmallIntegerField(default=0)
    times_correct = models.PositiveSmallIntegerField(default=0)
    last_reviewed_at = models.DateTimeField(blank=True, null=True)
    next_review_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "notes_flashcards"
        ordering = ["next_review_at", "-created_at"]
        indexes = [models.Index(fields=["user", "subject", "next_review_at"])]
