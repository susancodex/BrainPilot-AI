import pytest
from django.test import override_settings

from apps.subscriptions.models import Subscription
from apps.subscriptions.services import SubscriptionService
from common.exceptions import ConflictError

pytestmark = pytest.mark.django_db


class TestSubscriptionLimits:
    def test_ai_limit_blocks_when_exhausted(self, user):
        sub = SubscriptionService.get_or_create(user)
        sub.ai_requests_used = sub.ai_requests_limit
        sub.save(update_fields=["ai_requests_used"])

        with pytest.raises(ConflictError) as exc:
            SubscriptionService.assert_ai_allowed(user)
        assert "AI limit" in str(exc.value.message)

    def test_pdf_limit_blocks_when_exhausted(self, user):
        sub = SubscriptionService.get_or_create(user)
        sub.pdfs_uploaded = sub.pdfs_limit
        sub.save(update_fields=["pdfs_uploaded"])

        with pytest.raises(ConflictError) as exc:
            SubscriptionService.assert_pdf_upload_allowed(user)
        assert "PDF upload limit" in str(exc.value.message)

    def test_increment_ai_usage(self, user):
        sub = SubscriptionService.get_or_create(user)
        assert sub.ai_requests_used == 0
        SubscriptionService.increment_ai_usage(user)
        sub.refresh_from_db()
        assert sub.ai_requests_used == 1

    def test_staff_exempt_from_limits(self, admin_user):
        sub = SubscriptionService.get_or_create(admin_user)
        sub.ai_requests_used = sub.ai_requests_limit
        sub.pdfs_uploaded = sub.pdfs_limit
        sub.save(update_fields=["ai_requests_used", "pdfs_uploaded"])

        SubscriptionService.assert_ai_allowed(admin_user)
        SubscriptionService.assert_pdf_upload_allowed(admin_user)
