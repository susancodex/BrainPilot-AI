import logging
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    UserProfileSerializer, ChangePasswordSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
)
from .services import AuthService, UserProfileService
from common.responses import success_response, created_response, error_response

logger = logging.getLogger(__name__)


class HealthCheckView(APIView):
    """Basic liveness probe — returns 200 if the process is running."""
    permission_classes = [AllowAny]

    def get(self, request):
        return success_response(
            data={"status": "ok", "timestamp": timezone.now().isoformat()},
            message="BrainPilot AI is operational",
        )


class ReadinessCheckView(APIView):
    """Readiness probe — returns 200 only when DB and cache are reachable."""
    permission_classes = [AllowAny]

    def get(self, request):
        from django.db import connection, OperationalError as DBError
        from django.core.cache import cache

        checks = {}

        # Database
        try:
            connection.ensure_connection()
            checks["database"] = "ok"
        except DBError as exc:
            logger.error("Readiness: database unreachable — %s", exc)
            checks["database"] = "error"

        # Cache (Redis)
        try:
            cache.set("_readiness_probe", "1", timeout=5)
            assert cache.get("_readiness_probe") == "1"
            checks["cache"] = "ok"
        except Exception as exc:
            logger.warning("Readiness: cache unreachable — %s", exc)
            checks["cache"] = "degraded"

        all_ok = checks["database"] == "ok"
        return success_response(
            data={
                "status": "ready" if all_ok else "not_ready",
                "checks": checks,
                "timestamp": timezone.now().isoformat(),
            },
            message="Service is ready" if all_ok else "Service is not ready",
            status_code=200 if all_ok else 503,
        )


class LivenessCheckView(APIView):
    """Liveness probe — lightweight alive signal, never touches DB or cache."""
    permission_classes = [AllowAny]

    def get(self, request):
        import sys
        return success_response(
            data={
                "status": "alive",
                "timestamp": timezone.now().isoformat(),
                "python": sys.version.split()[0],
            },
        )


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data.copy()
        data.pop("password_confirm", None)
        user = AuthService.register_user(**data)
        return created_response(
            data=UserSerializer(user).data,
            message="Account created. Please verify your email.",
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            AuthService.record_failed_login(request.data.get("email", ""))
            return error_response("Invalid credentials.", errors=serializer.errors)

        tokens = AuthService.login_user(serializer.validated_data["user"], request=request)
        return success_response(
            data={
                "access": tokens["access"],
                "refresh": tokens["refresh"],
                "user": UserSerializer(tokens["user"]).data,
            },
            message="Login successful.",
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass
        return success_response(message="Logged out successfully.")


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")
        if not token:
            return error_response("Token is required.")
        user = AuthService.verify_email(token)
        return success_response(message="Email verified successfully.")


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        AuthService.request_password_reset(serializer.validated_data["email"])
        return success_response(message="If an account exists, a reset link has been sent.")


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        AuthService.confirm_password_reset(
            serializer.validated_data["token"],
            serializer.validated_data["new_password"],
        )
        return success_response(message="Password reset successful.")


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(data=UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(data=serializer.data, message="Profile updated.")


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        return success_response(message="Password changed successfully.")


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = UserProfileService.get_or_create_profile(request.user)
        return success_response(data=UserProfileSerializer(profile).data)

    def patch(self, request):
        profile = UserProfileService.get_or_create_profile(request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(data=serializer.data, message="Profile updated.")
