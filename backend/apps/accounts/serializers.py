from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .avatar_presets import DEFAULT_AVATAR_PRESET, VALID_AVATAR_PRESETS
from .models import User, UserProfile


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "first_name", "last_name", "password", "password_confirm"]
        extra_kwargs = {
            "email": {"validators": []},
        }

    def validate_email(self, value: str) -> str:
        email = User.objects.normalize_email(value)
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("This account is already registered.")
        return email

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        try:
            validate_password(
                attrs["password"],
                user=User(
                    email=attrs.get("email", ""),
                    first_name=attrs.get("first_name", ""),
                    last_name=attrs.get("last_name", ""),
                ),
            )
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})
        return attrs


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs["email"], password=attrs["password"])
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        if not user.is_active:
            raise serializers.ValidationError("Account is deactivated.")
        if user.is_locked:
            raise serializers.ValidationError("Account is temporarily locked. Try again later.")
        if settings.REQUIRE_EMAIL_VERIFICATION and not user.is_email_verified:
            raise serializers.ValidationError(
                "Please verify your email before signing in. Check your inbox for the verification link."
            )
        attrs["user"] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "avatar",
            "avatar_url",
            "avatar_preset",
            "bio",
            "phone",
            "timezone",
            "institution",
            "field_of_study",
            "academic_level",
            "study_goal_hours_per_week",
            "preferred_study_time",
            "updated_at",
        ]
        read_only_fields = ["avatar", "avatar_url", "updated_at"]

    def get_avatar_url(self, obj: UserProfile) -> str | None:
        if not obj.avatar:
            return None
        url = obj.avatar.url
        if not url.startswith("/"):
            return url
        request = self.context.get("request")
        if request is None:
            return url
        if settings.DEBUG:
            return url
        return request.build_absolute_uri(url)

    def validate_avatar_preset(self, value: str) -> str:
        if not value:
            return ""
        if value not in VALID_AVATAR_PRESETS:
            raise serializers.ValidationError("Invalid avatar preset.")
        return value

    def update(self, instance, validated_data):
        preset = validated_data.get("avatar_preset")
        if preset:
            if instance.avatar:
                instance.avatar.delete(save=False)
            validated_data["avatar"] = None
        return super().update(instance, validated_data)


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name", "full_name",
            "role", "is_email_verified", "profile", "created_at",
        ]
        read_only_fields = ["id", "email", "role", "is_email_verified", "created_at"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        profile = data.get("profile")
        if profile is not None and not profile.get("avatar_preset") and not profile.get("avatar_url"):
            profile["avatar_preset"] = DEFAULT_AVATAR_PRESET
        return data


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_current_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):
        validate_password(value)
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate_new_password(self, value):
        validate_password(value)
        return value
