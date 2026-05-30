from rest_framework import serializers
from .models import StudyPlan, StudySession


class StudySessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudySession
        fields = [
            "id", "subject", "topic", "scheduled_date", "start_time",
            "end_time", "duration_minutes", "status", "completion_percentage",
            "notes", "rescheduled_to", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class StudyPlanSerializer(serializers.ModelSerializer):
    sessions = StudySessionSerializer(many=True, read_only=True)
    session_count = serializers.SerializerMethodField()
    completed_sessions = serializers.SerializerMethodField()

    class Meta:
        model = StudyPlan
        fields = [
            "id", "title", "plan_type", "status", "subjects", "start_date",
            "end_date", "total_hours", "ai_generated", "notes", "sessions",
            "session_count", "completed_sessions", "created_at",
        ]
        read_only_fields = ["id", "ai_generated", "created_at"]

    def get_session_count(self, obj):
        return obj.sessions.count()

    def get_completed_sessions(self, obj):
        return obj.sessions.filter(status="completed").count()


class GeneratePlanSerializer(serializers.Serializer):
    subjects = serializers.ListField(child=serializers.CharField(), min_length=1)
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    plan_type = serializers.ChoiceField(choices=StudyPlan.PlanType.choices)
    daily_hours = serializers.FloatField(min_value=0.5, max_value=16, default=4)
    exam_date = serializers.DateField(required=False, allow_null=True)
    weak_topics = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    goals = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs["start_date"] >= attrs["end_date"]:
            raise serializers.ValidationError({"end_date": "End date must be after start date."})
        return attrs
