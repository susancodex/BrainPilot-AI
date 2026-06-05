import pytest
from django.contrib.auth import get_user_model
from django.test import override_settings

User = get_user_model()

pytestmark = pytest.mark.django_db


class TestEmailVerificationLogin:
    @override_settings(REQUIRE_EMAIL_VERIFICATION=True)
    def test_unverified_user_cannot_login_when_verification_required(self, api_client):
        User.objects.create_user(
            email="unverified@test.com",
            password="Str0ngP@ssword!",
            first_name="Unverified",
            last_name="User",
            is_email_verified=False,
        )
        response = api_client.post("/api/v1/auth/login/", {
            "email": "unverified@test.com",
            "password": "Str0ngP@ssword!",
        })
        assert response.status_code == 400
        assert response.data["success"] is False
        assert "verify" in response.data["message"].lower()

    @override_settings(REQUIRE_EMAIL_VERIFICATION=False)
    def test_unverified_user_can_login_when_verification_not_required(self, api_client):
        User.objects.create_user(
            email="debug-user@test.com",
            password="Str0ngP@ssword!",
            first_name="Debug",
            last_name="User",
            is_email_verified=False,
        )
        response = api_client.post("/api/v1/auth/login/", {
            "email": "debug-user@test.com",
            "password": "Str0ngP@ssword!",
        })
        assert response.status_code == 200
        assert "access" in response.data["data"]


class TestSubscriptionApiErrors:
    def test_pdf_upload_returns_409_when_limit_reached(self, auth_client, user):
        from apps.subscriptions.services import SubscriptionService

        sub = SubscriptionService.get_or_create(user)
        sub.pdfs_uploaded = sub.pdfs_limit
        sub.save(update_fields=["pdfs_uploaded"])

        from django.core.files.uploadedfile import SimpleUploadedFile

        response = auth_client.post(
            "/api/v1/pdfs/",
            {
                "file": SimpleUploadedFile(
                    "test.pdf", b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF", "application/pdf"
                ),
                "title": "Test",
            },
            format="multipart",
        )
        assert response.status_code == 409
