import logging
from datetime import timedelta

from django.utils import timezone
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, UserProfile, EmailVerificationToken
from common.exceptions import NotFoundError, ConflictError, AppError
from utils.helpers import generate_token

logger = logging.getLogger(__name__)

MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15


class AuthService:
    @staticmethod
    def register_user(email: str, first_name: str, last_name: str, password: str) -> User:
        if User.objects.filter(email=email).exists():
            raise ConflictError("An account with this email already exists.")

        user = User.objects.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password,
        )
        UserProfile.objects.create(user=user)

        if settings.DEBUG:
            user.is_email_verified = True
            user.save(update_fields=["is_email_verified"])
            logger.info("Dev mode: auto-verified email for %s", email)
        else:
            AuthService._send_verification_email(user)

        logger.info("New user registered: %s", email)
        return user

    @staticmethod
    def login_user(user: User, request=None) -> dict:
        if user.is_locked:
            raise AppError("Account temporarily locked due to too many failed attempts.", status_code=423)

        user.failed_login_attempts = 0
        user.locked_until = None
        if request:
            ip = request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR", ""))
            user.last_login_ip = ip.split(",")[0].strip() if ip else None
        user.save(update_fields=["failed_login_attempts", "locked_until", "last_login_ip"])

        refresh = RefreshToken.for_user(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": user,
        }

    @staticmethod
    def record_failed_login(email: str) -> None:
        try:
            user = User.objects.get(email=email)
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS:
                user.locked_until = timezone.now() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
                logger.warning("Account locked due to failed attempts: %s", email)
            user.save(update_fields=["failed_login_attempts", "locked_until"])
        except User.DoesNotExist:
            pass

    @staticmethod
    def verify_email(token: str) -> User:
        verification = EmailVerificationToken.objects.select_related("user").filter(
            token=token, used=False
        ).first()

        if not verification:
            raise AppError("Invalid or expired verification token.")
        if verification.expires_at < timezone.now():
            raise AppError("Verification token has expired.")

        user = verification.user
        user.is_email_verified = True
        user.save(update_fields=["is_email_verified"])
        verification.used = True
        verification.save(update_fields=["used"])
        logger.info("Email verified for: %s", user.email)
        return user

    @staticmethod
    def request_password_reset(email: str) -> None:
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return

        token = generate_token(32)
        user.password_reset_token = token
        user.password_reset_expires = timezone.now() + timedelta(hours=2)
        user.save(update_fields=["password_reset_token", "password_reset_expires"])

        try:
            from apps.accounts.tasks import send_password_reset_email
            send_password_reset_email.delay(user.id, token)
        except Exception:
            logger.warning("Could not queue password reset email for %s (broker unavailable)", user.email)

    @staticmethod
    def confirm_password_reset(token: str, new_password: str) -> User:
        try:
            user = User.objects.get(
                password_reset_token=token,
                password_reset_expires__gt=timezone.now(),
                is_active=True,
            )
        except User.DoesNotExist:
            raise AppError("Invalid or expired reset token.")

        user.set_password(new_password)
        user.password_reset_token = None
        user.password_reset_expires = None
        user.save(update_fields=["password", "password_reset_token", "password_reset_expires"])
        logger.info("Password reset completed for: %s", user.email)
        return user

    @staticmethod
    def _send_verification_email(user: User) -> None:
        token = generate_token(32)
        EmailVerificationToken.objects.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timedelta(hours=24),
        )
        try:
            from apps.accounts.tasks import send_verification_email
            send_verification_email.delay(user.id, token)
        except Exception:
            logger.warning("Could not queue verification email for %s (broker unavailable)", user.email)


class UserProfileService:
    @staticmethod
    def get_or_create_profile(user: User) -> UserProfile:
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return profile

    @staticmethod
    def update_profile(user: User, **data) -> UserProfile:
        profile = UserProfileService.get_or_create_profile(user)
        for key, value in data.items():
            setattr(profile, key, value)
        profile.save()
        return profile
