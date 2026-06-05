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
    flashcard_count = serializers.SerializerMethodField()
    title = serializers.CharField(max_length=500)
    content = serializers.CharField(max_length=500_000, allow_blank=True, required=False)

    class Meta:
        model = Note
        fields = [
            "id", "title", "content", "subject", "tags", "is_pinned",
            "ai_summary", "summary_generated_at", "flashcards", "flashcard_count",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "ai_summary", "summary_generated_at", "created_at", "updated_at"]

    def get_flashcard_count(self, obj):
        prefetched = getattr(obj, "_prefetched_objects_cache", {}).get("flashcards")
        if prefetched is not None:
            return len(prefetched)
        return obj.flashcards.count()


class NoteListSerializer(serializers.ModelSerializer):
    flashcard_count = serializers.SerializerMethodField()
    title = serializers.CharField(max_length=500)

    class Meta:
        model = Note
        fields = [
            "id", "title", "subject", "tags", "is_pinned", "ai_summary",
            "content", "flashcard_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "ai_summary", "created_at", "updated_at"]

    def get_flashcard_count(self, obj):
        prefetched = getattr(obj, "_prefetched_objects_cache", {}).get("flashcards")
        if prefetched is not None:
            return len(prefetched)
        return obj.flashcards.count()


class CreateFlashcardSerializer(serializers.Serializer):
    question = serializers.CharField(max_length=2000)
    answer = serializers.CharField(max_length=5000)
    subject = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    difficulty = serializers.ChoiceField(
        choices=["easy", "medium", "hard"], default="medium", required=False
    )
    note_id = serializers.UUIDField(required=False, allow_null=True)


class UpdateFlashcardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flashcard
        fields = ["question", "answer", "subject", "difficulty"]


class GenerateFlashcardsSerializer(serializers.Serializer):
    count = serializers.IntegerField(min_value=1, max_value=20, default=5)
