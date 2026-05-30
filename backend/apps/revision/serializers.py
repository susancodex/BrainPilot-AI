from rest_framework import serializers
from .models import RevisionTopic, RevisionSession


class RevisionTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = RevisionTopic
        fields = [
            "id", "subject", "topic", "confidence_level", "revision_count",
            "last_revised_at", "next_revision_at", "is_weak", "notes", "created_at",
        ]
        read_only_fields = ["id", "revision_count", "last_revised_at", "next_revision_at", "created_at"]


class RevisionSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RevisionSession
        fields = [
            "id", "topic", "duration_minutes", "confidence_before", "confidence_after", "notes", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class RecordRevisionSerializer(serializers.Serializer):
    topic_id = serializers.UUIDField()
    duration_minutes = serializers.IntegerField(min_value=1)
    confidence_after = serializers.IntegerField(min_value=1, max_value=5)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
