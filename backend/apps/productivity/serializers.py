from rest_framework import serializers
from .models import PomodoroSession, StudyStreak, FocusLog


class PomodoroSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PomodoroSession
        fields = [
            "id", "subject", "task_description", "work_duration_minutes",
            "break_duration_minutes", "pomodoros_completed", "pomodoros_planned",
            "status", "started_at", "ended_at", "total_focus_minutes", "created_at",
        ]
        read_only_fields = ["id", "started_at", "ended_at", "total_focus_minutes", "created_at"]


class StudyStreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyStreak
        fields = ["id", "current_streak", "longest_streak", "last_study_date", "total_study_days"]
        read_only_fields = ["id", "current_streak", "longest_streak", "total_study_days"]


class FocusLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = FocusLog
        fields = ["id", "date", "focus_minutes", "productivity_score", "subjects_studied", "created_at"]
        read_only_fields = ["id", "productivity_score", "created_at"]


class CompletePomodороSerializer(serializers.Serializer):
    pomodoros_completed = serializers.IntegerField(min_value=1)
