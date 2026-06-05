"""
Pytest fixtures shared across the entire test suite.
All DB-touching fixtures use Django's transactional test case semantics via
pytest-django's `db` / `django_db` marks — no explicit teardown needed.
"""
import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture(autouse=True)
def _disable_debug_toolbar_in_tests(settings):
    """Debug toolbar breaks API tests when DEBUG is toggled via override_settings."""
    settings.MIDDLEWARE = [
        m for m in settings.MIDDLEWARE if m != "debug_toolbar.middleware.DebugToolbarMiddleware"
    ]

# ── User fixtures ─────────────────────────────────────────────────────────────

@pytest.fixture
def user(db) -> User:
    """Standard authenticated user."""
    return User.objects.create_user(
        email="student@test.com",
        password="Str0ngP@ssword!",
        first_name="Alice",
        last_name="Study",
        is_email_verified=True,
    )


@pytest.fixture
def second_user(db) -> User:
    """A second user — for ownership / isolation tests."""
    return User.objects.create_user(
        email="other@test.com",
        password="Str0ngP@ssword!",
        first_name="Bob",
        last_name="Other",
    )


@pytest.fixture
def admin_user(db) -> User:
    return User.objects.create_superuser(
        email="admin@test.com",
        password="Adm1nP@ss!",
    )


# ── API client fixtures ───────────────────────────────────────────────────────

@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def auth_client(api_client, user):
    """APIClient pre-authenticated as `user` via JWT."""
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return api_client


# ── Domain fixtures ───────────────────────────────────────────────────────────

@pytest.fixture
def note(db, user):
    from apps.notes.models import Note
    return Note.objects.create(
        user=user,
        title="Newton's Laws of Motion",
        content=(
            "Newton's first law: an object at rest stays at rest. "
            "Newton's second law: F = ma. "
            "Newton's third law: every action has an equal and opposite reaction."
        ),
        subject="Physics",
    )


@pytest.fixture
def completed_pomodoro(db, user):
    """A completed PomodoroSession with 2 pomodoros (50 focus minutes)."""
    from apps.productivity.models import PomodoroSession
    from django.utils import timezone
    return PomodoroSession.objects.create(
        user=user,
        subject="Maths",
        work_duration_minutes=25,
        break_duration_minutes=5,
        pomodoros_completed=2,
        pomodoros_planned=4,
        status=PomodoroSession.Status.COMPLETED,
        ended_at=timezone.now(),
        total_focus_minutes=50,
    )
