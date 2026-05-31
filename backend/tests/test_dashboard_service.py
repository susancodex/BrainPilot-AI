"""
Unit tests for DashboardService.get_dashboard_summary.

Verifies the shape and correctness of the summary payload returned
for a fresh user (zero state) and a user with data.
"""
import pytest

pytestmark = pytest.mark.django_db


class TestDashboardSummaryShape:
    def test_returns_all_required_keys_for_new_user(self, user):
        from apps.dashboard.services import DashboardService
        summary = DashboardService.get_dashboard_summary(user)

        assert "streak" in summary
        assert "today" in summary
        assert "week" in summary
        assert "goals" in summary
        assert "revision" in summary
        assert "plans" in summary

    def test_streak_defaults_to_zero_for_new_user(self, user):
        from apps.dashboard.services import DashboardService
        summary = DashboardService.get_dashboard_summary(user)

        assert summary["streak"]["current"] == 0
        assert summary["streak"]["longest"] == 0
        assert summary["streak"]["total_days"] == 0

    def test_today_focus_defaults_to_zero(self, user):
        from apps.dashboard.services import DashboardService
        summary = DashboardService.get_dashboard_summary(user)

        assert summary["today"]["focus_minutes"] == 0
        assert summary["today"]["productivity_score"] == 0

    def test_last_quiz_is_none_when_no_attempts(self, user):
        from apps.dashboard.services import DashboardService
        summary = DashboardService.get_dashboard_summary(user)
        assert summary["last_quiz"] is None

    def test_streak_reflects_logged_session(self, user):
        from apps.productivity.services import ProductivityService
        from apps.dashboard.services import DashboardService

        ProductivityService.log_session(user, subject="Maths", focus_minutes=30)
        summary = DashboardService.get_dashboard_summary(user)

        assert summary["streak"]["current"] == 1
        assert summary["today"]["focus_minutes"] == 30

    def test_week_focus_accumulates(self, user):
        from apps.productivity.services import ProductivityService
        from apps.dashboard.services import DashboardService

        ProductivityService.log_session(user, subject="English", focus_minutes=25)
        ProductivityService.log_session(user, subject="History", focus_minutes=40)
        summary = DashboardService.get_dashboard_summary(user)

        assert summary["week"]["focus_minutes"] == 65
