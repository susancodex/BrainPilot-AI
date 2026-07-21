import logging

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import AccessToken

logger = logging.getLogger(__name__)


class CustomAccessToken(AccessToken):
    """Access token that stores user_id as a string (UUID primary keys)."""

    @classmethod
    def for_user(cls, user):
        token = cls()
        token["user_id"] = str(user.id)
        token["email"] = user.email
        return token


class CookieJWTAuthentication(JWTAuthentication):
    """
    Read JWT from HttpOnly cookie (browser) or Authorization header (API/tests).
    """

    def get_header(self, request):
        access_token = request.COOKIES.get("access_token")
        if access_token:
            return f"Bearer {access_token}".encode()
        return super().get_header(request)

    def get_user(self, validated_token):
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError as exc:
            raise InvalidToken("Token contained no recognizable user identification") from exc

        from apps.accounts.models import User

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist as exc:
            raise InvalidToken("User not found") from exc

        if not user.is_active:
            raise InvalidToken("User is inactive")

        return user
