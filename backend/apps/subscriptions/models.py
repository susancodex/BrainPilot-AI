from django.db import models
from django.conf import settings
from common.base_models import BaseModel


class Plan(models.TextChoices):
    FREE = "free", "Free"
    PREMIUM = "premium", "Premium"
    ENTERPRISE = "enterprise", "Enterprise"


class SubscriptionStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    CANCELLED = "cancelled", "Cancelled"
    EXPIRED = "expired", "Expired"
    TRIAL = "trial", "Trial"


class Subscription(BaseModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscription",
    )
    plan = models.CharField(
        max_length=20,
        choices=Plan.choices,
        default=Plan.FREE,
    )
    status = models.CharField(
        max_length=20,
        choices=SubscriptionStatus.choices,
        default=SubscriptionStatus.ACTIVE,
    )
    started_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    cancelled_at = models.DateTimeField(blank=True, null=True)
    ai_requests_used = models.PositiveIntegerField(default=0)
    ai_requests_limit = models.PositiveIntegerField(default=50)
    pdfs_uploaded = models.PositiveIntegerField(default=0)
    pdfs_limit = models.PositiveSmallIntegerField(default=3)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "subscriptions_subscriptions"

    def __str__(self):
        return f"{self.user.email} — {self.plan}"

    @property
    def is_premium(self):
        return self.plan in (Plan.PREMIUM, Plan.ENTERPRISE) and self.status == SubscriptionStatus.ACTIVE

    @property
    def ai_requests_remaining(self):
        return max(0, self.ai_requests_limit - self.ai_requests_used)


PLAN_LIMITS = {
    Plan.FREE: {"ai_requests_limit": 50, "pdfs_limit": 3},
    Plan.PREMIUM: {"ai_requests_limit": 1000, "pdfs_limit": 50},
    Plan.ENTERPRISE: {"ai_requests_limit": 99999, "pdfs_limit": 999},
}

PLAN_FEATURES = {
    Plan.FREE: {
        "name": "Free",
        "price_monthly": 0,
        "price_yearly": 0,
        "ai_requests": 50,
        "pdf_uploads": 3,
        "features": [
            "50 AI requests/month",
            "3 PDF uploads",
            "Basic quiz generation",
            "Study planner",
            "Notes & flashcards",
        ],
    },
    Plan.PREMIUM: {
        "name": "Premium",
        "price_monthly": 12,
        "price_yearly": 99,
        "ai_requests": 1000,
        "pdf_uploads": 50,
        "features": [
            "1,000 AI requests/month",
            "50 PDF uploads",
            "Advanced quiz generation",
            "AI study planner",
            "Smart revision engine",
            "Performance analytics",
            "Priority support",
        ],
    },
    Plan.ENTERPRISE: {
        "name": "Enterprise",
        "price_monthly": 49,
        "price_yearly": 399,
        "ai_requests": 99999,
        "pdf_uploads": 999,
        "features": [
            "Unlimited AI requests",
            "Unlimited PDF uploads",
            "All Premium features",
            "Team management",
            "Custom integrations",
            "Dedicated support",
        ],
    },
}
