from rest_framework import serializers
from .models import Subscription, PLAN_FEATURES


class SubscriptionSerializer(serializers.ModelSerializer):
    is_premium = serializers.BooleanField(read_only=True)
    ai_requests_remaining = serializers.IntegerField(read_only=True)
    plan_display = serializers.CharField(source="get_plan_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Subscription
        fields = [
            "id", "plan", "plan_display", "status", "status_display",
            "started_at", "expires_at", "is_premium",
            "ai_requests_used", "ai_requests_limit", "ai_requests_remaining",
            "pdfs_uploaded", "pdfs_limit",
        ]
        read_only_fields = fields


class PlanInfoSerializer(serializers.Serializer):
    name = serializers.CharField()
    price_monthly = serializers.IntegerField()
    price_yearly = serializers.IntegerField()
    ai_requests = serializers.IntegerField()
    pdf_uploads = serializers.IntegerField()
    features = serializers.ListField(child=serializers.CharField())
