from django.urls import path
from . import views

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="auth-register"),
    path("login/", views.LoginView.as_view(), name="auth-login"),
    path("logout/", views.LogoutView.as_view(), name="auth-logout"),
    path("verify-email/", views.VerifyEmailView.as_view(), name="auth-verify-email"),
    path("password/reset/", views.PasswordResetRequestView.as_view(), name="auth-password-reset"),
    path("password/reset/confirm/", views.PasswordResetConfirmView.as_view(), name="auth-password-reset-confirm"),
    path("me/", views.MeView.as_view(), name="auth-me"),
    path("me/change-password/", views.ChangePasswordView.as_view(), name="auth-change-password"),
    path("me/profile/", views.ProfileView.as_view(), name="auth-profile"),
    path("me/profile/avatar/", views.ProfileAvatarView.as_view(), name="auth-profile-avatar"),
    path("me/profile/avatar-presets/", views.AvatarPresetsView.as_view(), name="auth-avatar-presets"),
]
