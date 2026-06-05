import logging

from django.conf import settings
from common.exceptions import ConflictError
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
    def _is_exempt(user) -> bool:
        return bool(getattr(user, "is_staff", False) or getattr(user, "is_superuser", False))

    @staticmethod
    def assert_ai_allowed(user) -> None:
        if SubscriptionService._is_exempt(user):
            return
        sub = SubscriptionService.get_or_create(user)
        if sub.status != SubscriptionStatus.ACTIVE:
            raise ConflictError("Your subscription is not active.")
        if sub.ai_requests_used >= sub.ai_requests_limit:
            raise ConflictError(
                f"Monthly AI limit reached ({sub.ai_requests_limit} requests). "
                "Upgrade your plan on the Subscription page."
            )

    @staticmethod
    def assert_pdf_upload_allowed(user) -> None:
        if SubscriptionService._is_exempt(user):
            return
        sub = SubscriptionService.get_or_create(user)
        if sub.status != SubscriptionStatus.ACTIVE:
            raise ConflictError("Your subscription is not active.")
        if sub.pdfs_uploaded >= sub.pdfs_limit:
            raise ConflictError(
                f"PDF upload limit reached ({sub.pdfs_limit} files). "
                "Upgrade your plan on the Subscription page."
            )

    @staticmethod
    def increment_ai_usage(user) -> None:
        if SubscriptionService._is_exempt(user):
            return
        sub = SubscriptionService.get_or_create(user)
        Subscription.objects.filter(id=sub.id).update(
            ai_requests_used=sub.ai_requests_used + 1
        )

    @staticmethod
    def increment_pdf_upload(user) -> None:
        if SubscriptionService._is_exempt(user):
            return
        sub = SubscriptionService.get_or_create(user)
        Subscription.objects.filter(id=sub.id).update(
            pdfs_uploaded=sub.pdfs_uploaded + 1
        )
