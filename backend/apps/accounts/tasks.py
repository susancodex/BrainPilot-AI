import logging
from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_verification_email(self, user_id: str, token: str):
    try:
        from apps.accounts.models import User
        user = User.objects.get(id=user_id)
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        send_mail(
            subject="Verify your BrainPilot AI account",
            message=f"Click here to verify your email: {verification_url}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info("Verification email sent to %s", user.email)
    except Exception as exc:
        logger.error("Failed to send verification email: %s", exc)
        self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_password_reset_email(self, user_id: str, token: str):
    try:
        from apps.accounts.models import User
        user = User.objects.get(id=user_id)
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        send_mail(
            subject="Reset your BrainPilot AI password",
            message=f"Click here to reset your password: {reset_url}\n\nThis link expires in 2 hours.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info("Password reset email sent to %s", user.email)
    except Exception as exc:
        logger.error("Failed to send password reset email: %s", exc)
        self.retry(exc=exc)
