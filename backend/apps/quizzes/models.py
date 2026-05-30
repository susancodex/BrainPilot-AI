from django.db import models
from django.conf import settings
from common.base_models import BaseModel


class Quiz(BaseModel):
    class Difficulty(models.TextChoices):
        EASY = "easy", "Easy"
        MEDIUM = "medium", "Medium"
        HARD = "hard", "Hard"
        MIXED = "mixed", "Mixed"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quizzes")
    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    topic = models.CharField(max_length=255, blank=True)
    difficulty = models.CharField(max_length=20, choices=Difficulty.choices, default=Difficulty.MEDIUM)
    questions = models.JSONField(default=list)
    question_count = models.PositiveSmallIntegerField(default=0)
    ai_generated = models.BooleanField(default=True)
    source_note = models.ForeignKey(
        "notes.Note", on_delete=models.SET_NULL, null=True, blank=True, related_name="quizzes"
    )

    class Meta:
        db_table = "quizzes_quizzes"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "subject"])]


class QuizAttempt(BaseModel):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quiz_attempts")
    answers = models.JSONField(default=list)
    score = models.FloatField(default=0)
    max_score = models.FloatField(default=0)
    percentage = models.FloatField(default=0)
    time_taken_seconds = models.PositiveIntegerField(default=0)
    ai_feedback = models.TextField(blank=True)
    completed = models.BooleanField(default=False)

    class Meta:
        db_table = "quizzes_attempts"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "quiz", "completed"])]
