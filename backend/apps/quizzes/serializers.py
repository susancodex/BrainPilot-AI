from rest_framework import serializers
from .models import Quiz, QuizAttempt


class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = [
            "id", "title", "subject", "topic", "difficulty", "questions",
            "question_count", "ai_generated", "created_at",
        ]
        read_only_fields = ["id", "ai_generated", "question_count", "created_at"]


class QuizAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = [
            "id", "quiz", "answers", "score", "max_score", "percentage",
            "time_taken_seconds", "ai_feedback", "completed", "created_at",
        ]
        read_only_fields = ["id", "score", "max_score", "percentage", "ai_feedback", "completed", "created_at"]


class GenerateQuizSerializer(serializers.Serializer):
    subject = serializers.CharField()
    topic = serializers.CharField(required=False, allow_blank=True, default="")
    difficulty = serializers.ChoiceField(choices=Quiz.Difficulty.choices, default="medium")
    question_count = serializers.IntegerField(min_value=3, max_value=30, default=10)
    note_id = serializers.UUIDField(required=False, allow_null=True)
    context = serializers.CharField(required=False, allow_blank=True, default="")


class SubmitAttemptSerializer(serializers.Serializer):
    answers = serializers.ListField(child=serializers.DictField())
    time_taken_seconds = serializers.IntegerField(min_value=0)
