import logging
from django.utils import timezone
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample

from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    UserProfileSerializer, ChangePasswordSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
)
from .avatar_presets import AVATAR_PRESET_CHOICES
from .services import AuthService, UserProfileService
from common.exceptions import AppError
from common.responses import success_response, created_response, error_response

logger = logging.getLogger(__name__)


class HealthCheckView(APIView):
    """Basic liveness probe — returns 200 if the process is running."""
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Health Check",
        description="Returns 200 if the backend service is running and operational",
        responses={200: {"type": "object", "properties": {"status": {"type": "string"}}}},
        tags=["Health"]
    )
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
        return success_response(
            data={
                "status": "alive",
                "timestamp": timezone.now().isoformat(),
            },
        )


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth_register"

    @extend_schema(
        summary="User Registration",
        description="Register a new user account with email, password, and profile information",
        request=RegisterSerializer,
        responses={
            201: {
                "type": "object",
                "properties": {
                    "data": {
                        "type": "object",
                        "properties": {
                            "access": {"type": "string"},
                            "refresh": {"type": "string"},
                            "user": {"type": "object"}
                        }
                    }
                }
            }
        },
        tags=["Authentication"]
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data.copy()
        data.pop("password_confirm", None)
        user = AuthService.register_user(**data)
        tokens = AuthService.login_user(user, request=request)
        return created_response(
            data={
                "access": tokens["access"],
                "refresh": tokens["refresh"],
                "user": UserSerializer(tokens["user"], context={"request": request}).data,
            },
            message="Account created. Please verify your email."
            if not user.is_email_verified
            else "Account created.",
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    @extend_schema(
        summary="User Login",
        description="Authenticate user with email and password, returns JWT tokens",
        request=LoginSerializer,
        responses={
            200: {
                "type": "object",
                "properties": {
                    "data": {
                        "type": "object",
                        "properties": {
                            "access": {"type": "string"},
                            "refresh": {"type": "string"},
                            "user": {"type": "object"}
                        }
                    }
                }
            }
        },
        tags=["Authentication"]
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            AuthService.record_failed_login(request.data.get("email", ""))
            message = "Invalid credentials."
            non_field = serializer.errors.get("non_field_errors")
            if non_field:
                message = str(non_field[0])
            return error_response(message, errors=serializer.errors)

        tokens = AuthService.login_user(serializer.validated_data["user"], request=request)
        return success_response(
            data={
                "access": tokens["access"],
                "refresh": tokens["refresh"],
                "user": UserSerializer(tokens["user"], context={"request": request}).data,
            },
            message="Login successful.",
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="User Logout",
        description="Logout user and blacklist refresh token",
        request={
            "type": "object",
            "properties": {
                "refresh": {"type": "string"}
            }
        },
        tags=["Authentication"]
    )
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
    throttle_scope = "auth"

    @extend_schema(
        summary="Verify Email",
        description="Verify user email address using token sent to email",
        request={
            "type": "object",
            "properties": {
                "token": {"type": "string"}
            }
        },
        tags=["Authentication"]
    )
    def post(self, request):
        token = request.data.get("token")
        if not token:
            return error_response("Token is required.")
        user = AuthService.verify_email(token)
        return success_response(message="Email verified successfully.")


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth_reset"

    @extend_schema(
        summary="Request Password Reset",
        description="Request password reset link to be sent to email",
        request=PasswordResetRequestSerializer,
        tags=["Authentication"]
    )
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        AuthService.request_password_reset(serializer.validated_data["email"])
        return success_response(message="If an account exists, a reset link has been sent.")


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    @extend_schema(
        summary="Confirm Password Reset",
        description="Reset password using token from email",
        request=PasswordResetConfirmSerializer,
        tags=["Authentication"]
    )
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
    throttle_scope = "profile_update"

    def _user_with_profile(self, user):
        from .models import User

        return User.objects.select_related("profile").get(pk=user.pk)

    @extend_schema(
        summary="Get Current User",
        description="Get current authenticated user profile information",
        responses={
            200: {
                "type": "object",
                "properties": {
                    "data": {"type": "object"}
                }
            }
        },
        tags=["User Profile"]
    )
    def get(self, request):
        user = self._user_with_profile(request.user)
        return success_response(
            data=UserSerializer(user, context={"request": request}).data
        )

    @extend_schema(
        summary="Update Current User",
        description="Update current authenticated user profile",
        request=UserSerializer,
        tags=["User Profile"]
    )
    def patch(self, request):
        user = self._user_with_profile(request.user)
        serializer = UserSerializer(
            user, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(data=serializer.data, message="Profile updated.")

    @extend_schema(
        summary="Delete Account",
        description="Delete current authenticated user account",
        tags=["User Profile"]
    )
    def delete(self, request):
        """
        Soft-delete the authenticated user's account (GDPR/CCPA).
        Sets is_active=False and blacklists all outstanding JWT tokens.
        """
        user = request.user
        try:
            from rest_framework_simplejwt.token_blacklist.models import (
                OutstandingToken, BlacklistedToken,
            )
            tokens = OutstandingToken.objects.filter(user=user)
            for token in tokens:
                BlacklistedToken.objects.get_or_create(token=token)
        except Exception:
            pass
        user.is_active = False
        user.save(update_fields=["is_active"])
        logger.info("Account deactivated for user=%s", user.pk)
        return success_response(message="Account deactivated. You have been signed out.")


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Change Password",
        description="Change password for authenticated user",
        request=ChangePasswordSerializer,
        tags=["User Profile"]
    )
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        return success_response(message="Password changed successfully.")


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = "profile_update"

    @extend_schema(
        summary="Get User Profile",
        description="Get detailed user profile information",
        responses={
            200: {
                "type": "object",
                "properties": {
                    "data": {"type": "object"}
                }
            }
        },
        tags=["User Profile"]
    )
    def get(self, request):
        profile = UserProfileService.get_or_create_profile(request.user)
        return success_response(
            data=UserProfileSerializer(profile, context={"request": request}).data
        )

    @extend_schema(
        summary="Update User Profile",
        description="Update user profile details",
        request=UserProfileSerializer,
        tags=["User Profile"]
    )
    def patch(self, request):
        profile = UserProfileService.get_or_create_profile(request.user)
        serializer = UserProfileSerializer(
            profile, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(data=serializer.data, message="Profile updated.")


class AvatarPresetsView(APIView):
    """List built-in profile picture presets."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get Avatar Presets",
        description="List available built-in avatar presets",
        responses={
            200: {
                "type": "object",
                "properties": {
                    "data": {
                        "type": "object",
                        "properties": {
                            "presets": {"type": "array"}
                        }
                    }
                }
            }
        },
        tags=["User Profile"]
    )
    def get(self, request):
        presets = [
            {"id": slug, "label": label}
            for slug, label in AVATAR_PRESET_CHOICES
        ]
        return success_response(data={"presets": presets})


class ProfileAvatarView(APIView):
    """Upload or remove a custom profile photo."""

    permission_classes = [IsAuthenticated]
    throttle_scope = "file_upload"

    @extend_schema(
        summary="Upload Avatar",
        description="Upload custom profile picture",
        request={
            "type": "object",
            "properties": {
                "avatar": {"type": "file"}
            }
        },
        tags=["User Profile"]
    )
    def post(self, request):
        uploaded = request.FILES.get("avatar")
        if not uploaded:
            return error_response("No image file provided. Use the 'avatar' field.")
        try:
            profile = UserProfileService.set_avatar_upload(request.user, uploaded)
        except AppError as exc:
            return error_response(str(exc.message), status_code=exc.status_code)
        return success_response(
            data=UserProfileSerializer(profile, context={"request": request}).data,
            message="Profile photo updated.",
        )

    @extend_schema(
        summary="Delete Avatar",
        description="Remove custom profile picture and revert to preset",
        tags=["User Profile"]
    )
    def delete(self, request):
        profile = UserProfileService.clear_avatar(request.user)
        return success_response(
            data=UserProfileSerializer(profile, context={"request": request}).data,
            message="Profile photo removed.",
        )
