from rest_framework import serializers
from .models import Goal, GoalMilestone


class GoalMilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoalMilestone
        fields = ["id", "title", "description", "due_date", "completed", "completed_at", "created_at"]
        read_only_fields = ["id", "completed_at", "created_at"]


class GoalSerializer(serializers.ModelSerializer):
    milestone_items = GoalMilestoneSerializer(many=True, read_only=True)

    class Meta:
        model = Goal
        fields = [
            "id", "title", "description", "category", "status", "priority",
            "target_date", "progress", "milestones", "milestone_items", "created_at",
        ]
        read_only_fields = ["id", "created_at"]
