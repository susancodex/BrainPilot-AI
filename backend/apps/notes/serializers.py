from rest_framework import serializers
from .models import Note, Flashcard


class FlashcardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flashcard
        fields = [
            "id", "question", "answer", "subject", "difficulty",
            "times_reviewed", "times_correct", "last_reviewed_at", "next_review_at", "created_at",
        ]
        read_only_fields = ["id", "times_reviewed", "times_correct", "last_reviewed_at", "next_review_at", "created_at"]


class NoteSerializer(serializers.ModelSerializer):
    flashcards = FlashcardSerializer(many=True, read_only=True)

    class Meta:
        model = Note
        fields = [
            "id", "title", "content", "subject", "tags", "is_pinned",
            "ai_summary", "summary_generated_at", "flashcards", "created_at",
        ]
        read_only_fields = ["id", "ai_summary", "summary_generated_at", "created_at"]


class NoteListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ["id", "title", "subject", "tags", "is_pinned", "ai_summary", "created_at"]
        read_only_fields = ["id", "ai_summary", "created_at"]


class GenerateSummarySerializer(serializers.Serializer):
    note_id = serializers.UUIDField()


class GenerateFlashcardsSerializer(serializers.Serializer):
    note_id = serializers.UUIDField()
    count = serializers.IntegerField(min_value=1, max_value=20, default=5)
