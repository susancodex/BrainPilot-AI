import logging
from django.utils import timezone
from .models import Subscription, Plan, SubscriptionStatus, PLAN_LIMITS, PLAN_FEATURES

logger = logging.getLogger(__name__)


class SubscriptionService:
    @staticmethod
    def get_or_create(user) -> Subscription:
        sub, _ = Subscription.objects.get_or_create(
            user=user,
            defaults={
                "plan": Plan.FREE,
                "status": SubscriptionStatus.ACTIVE,
                "ai_requests_limit": PLAN_LIMITS[Plan.FREE]["ai_requests_limit"],
                "pdfs_limit": PLAN_LIMITS[Plan.FREE]["pdfs_limit"],
            },
        )
        return sub

    @staticmethod
    def get_all_plans():
        return [
            {"plan_key": k, **v}
            for k, v in PLAN_FEATURES.items()
        ]

    @staticmethod
    def increment_ai_usage(user):
        sub = SubscriptionService.get_or_create(user)
        Subscription.objects.filter(id=sub.id).update(
            ai_requests_used=sub.ai_requests_used + 1
        )

    @staticmethod
    def increment_pdf_upload(user):
        sub = SubscriptionService.get_or_create(user)
        Subscription.objects.filter(id=sub.id).update(
            pdfs_uploaded=sub.pdfs_uploaded + 1
        )
