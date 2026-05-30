import logging
from datetime import timedelta
from django.utils import timezone

logger = logging.getLogger(__name__)


class DashboardService:
    @staticmethod
    def get_dashboard_summary(user) -> dict:
        from apps.productivity.models import StudyStreak, FocusLog
        from apps.planner.models import StudyPlan, StudySession
        from apps.goals.models import Goal
        from apps.revision.models import RevisionTopic
        from apps.quizzes.models import QuizAttempt

        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())

        streak, _ = StudyStreak.objects.get_or_create(user=user)
        today_log = FocusLog.objects.filter(user=user, date=today).first()
        week_focus = FocusLog.objects.filter(user=user, date__gte=week_start).aggregate(
            total=__import__("django.db.models", fromlist=["Sum"]).Sum("focus_minutes")
        )["total"] or 0

        active_plans = StudyPlan.objects.filter(user=user, status="active").count()
        today_sessions = StudySession.objects.filter(
            plan__user=user,
            scheduled_date=today,
        ).select_related("plan")

        active_goals = Goal.objects.filter(user=user, status="in_progress").count()
        due_revisions = RevisionTopic.objects.filter(user=user, next_revision_at__lte=timezone.now()).count()
        weak_topics = RevisionTopic.objects.filter(user=user, is_weak=True).count()
        recent_quiz = QuizAttempt.objects.filter(user=user, completed=True).order_by("-created_at").first()

        return {
            "streak": {
                "current": streak.current_streak,
                "longest": streak.longest_streak,
                "total_days": streak.total_study_days,
            },
            "today": {
                "focus_minutes": today_log.focus_minutes if today_log else 0,
                "productivity_score": today_log.productivity_score if today_log else 0,
                "sessions_scheduled": today_sessions.count(),
                "sessions_completed": today_sessions.filter(status="completed").count(),
            },
            "week": {
                "focus_minutes": week_focus,
            },
            "goals": {
                "active": active_goals,
            },
            "revision": {
                "due": due_revisions,
                "weak_topics": weak_topics,
            },
            "plans": {
                "active": active_plans,
            },
            "last_quiz": {
                "subject": recent_quiz.quiz.subject if recent_quiz else None,
                "percentage": recent_quiz.percentage if recent_quiz else None,
            } if recent_quiz else None,
        }
