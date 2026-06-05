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
        assert "today_sessions" in summary
        assert "today_focus_minutes" in summary
        assert "notes_count" in summary
        assert "goals_summary" in summary
        assert "due_revisions" in summary
        assert "recent_activity" in summary
        assert "upcoming_sessions" in summary
        assert "ai_suggestion" in summary

    def test_streak_defaults_to_zero_for_new_user(self, user):
        from apps.dashboard.services import DashboardService

        summary = DashboardService.get_dashboard_summary(user)

        assert summary["streak"] == 0

    def test_today_focus_defaults_to_zero(self, user):
        from apps.dashboard.services import DashboardService

        summary = DashboardService.get_dashboard_summary(user)

        assert summary["today_focus_minutes"] == 0

    def test_goals_summary_defaults_for_new_user(self, user):
        from apps.dashboard.services import DashboardService

        summary = DashboardService.get_dashboard_summary(user)

        assert summary["goals_summary"]["active"] == 0
        assert summary["goals_summary"]["completed"] == 0
        assert summary["goals_summary"]["total"] == 0

    def test_streak_reflects_logged_session(self, user):
        from apps.productivity.services import ProductivityService
        from apps.dashboard.services import DashboardService

        ProductivityService.log_session(user, subject="Maths", focus_minutes=30)
        summary = DashboardService.get_dashboard_summary(user)

        assert summary["streak"] >= 1
        assert summary["today_focus_minutes"] == 30

    def test_recent_activity_includes_focus_log(self, user):
        from apps.productivity.services import ProductivityService
        from apps.dashboard.services import DashboardService

        ProductivityService.log_session(user, subject="English", focus_minutes=25)
        ProductivityService.log_session(user, subject="History", focus_minutes=40)
        summary = DashboardService.get_dashboard_summary(user)

        assert len(summary["recent_activity"]) >= 1
        assert any("English" in a["description"] or "History" in a["description"] for a in summary["recent_activity"])
