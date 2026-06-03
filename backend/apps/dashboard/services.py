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
        from apps.notes.models import Note

        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())

        streak, _ = StudyStreak.objects.get_or_create(user=user)
        today_log = FocusLog.objects.filter(user=user, date=today).first()

        today_sessions_qs = StudySession.objects.filter(
            plan__user=user,
            scheduled_date=today,
        ).select_related("plan")

        active_goals = Goal.objects.filter(user=user, status="in_progress").count()
        completed_goals = Goal.objects.filter(user=user, status="completed").count()
        total_goals = Goal.objects.filter(user=user).count()

        due_revisions = RevisionTopic.objects.filter(
            user=user, next_revision_at__lte=timezone.now()
        ).count()

        notes_count = Note.objects.filter(user=user).count()

        recent_activity = DashboardService._build_recent_activity(user)
        upcoming_sessions = DashboardService._build_upcoming_sessions(user, today)
        ai_suggestion = DashboardService._build_ai_suggestion(streak, active_goals, due_revisions)

        return {
            "streak": streak.current_streak,
            "today_sessions": today_sessions_qs.count(),
            "notes_count": notes_count,
            "goals_summary": {
                "active": active_goals,
                "completed": completed_goals,
                "total": total_goals,
            },
            "due_revisions": due_revisions,
            "today_focus_minutes": today_log.focus_minutes if today_log else 0,
            "recent_activity": recent_activity,
            "upcoming_sessions": upcoming_sessions,
            "ai_suggestion": ai_suggestion,
        }

    @staticmethod
    def _build_recent_activity(user) -> list:
        from apps.productivity.models import FocusLog
        from apps.quizzes.models import QuizAttempt
        from apps.notes.models import Note
        from datetime import datetime, timezone as dt_timezone

        activities = []

        for log in FocusLog.objects.filter(user=user).order_by("-date")[:3]:
            subjects = ", ".join(log.subjects_studied) if log.subjects_studied else "study"
            ts = datetime.combine(log.date, datetime.min.time(), tzinfo=dt_timezone.utc)
            activities.append({
                "description": f"Studied {subjects} for {log.focus_minutes} minutes",
                "time": log.date.strftime("%b %d"),
                "type": "focus",
                "_ts": ts,
            })

        for attempt in QuizAttempt.objects.filter(user=user, completed=True).select_related("quiz").order_by("-created_at")[:3]:
            activities.append({
                "description": f"Completed {attempt.quiz.subject} quiz — {attempt.percentage:.0f}%",
                "time": attempt.created_at.strftime("%b %d"),
                "type": "quiz",
                "_ts": attempt.created_at,
            })

        for note in Note.objects.filter(user=user).order_by("-updated_at")[:2]:
            activities.append({
                "description": f"Updated note: {note.title}",
                "time": note.updated_at.strftime("%b %d"),
                "type": "note",
                "_ts": note.updated_at,
            })

        activities.sort(key=lambda x: x["_ts"], reverse=True)
        for item in activities:
            del item["_ts"]
        return activities[:8]

    @staticmethod
    def _build_upcoming_sessions(user, today) -> list:
        from apps.planner.models import StudySession
        from datetime import timedelta

        sessions = StudySession.objects.filter(
            plan__user=user,
            scheduled_date__gte=today,
            scheduled_date__lte=today + timedelta(days=7),
            status="scheduled",
        ).select_related("plan").order_by("scheduled_date", "start_time")[:5]

        return [
            {
                "id": str(s.id),
                "subject": s.subject,
                "topic": s.topic,
                "scheduled_date": str(s.scheduled_date),
                "start_time": str(s.start_time) if s.start_time else None,
                "end_time": str(s.end_time) if s.end_time else None,
                "status": s.status,
                "duration_minutes": s.duration_minutes,
            }
            for s in sessions
        ]

    @staticmethod
    def _build_ai_suggestion(streak, active_goals, due_revisions) -> str:
        if due_revisions > 3:
            return f"You have {due_revisions} topics due for revision. Prioritise these to strengthen your memory."
        if streak.current_streak >= 7:
            return f"Amazing {streak.current_streak}-day streak! Keep the momentum — consistency is the key to mastery."
        if active_goals == 0:
            return "Set a learning goal to give your study sessions direction and motivation."
        if streak.current_streak == 0:
            return "Start a study session today to begin building your streak — even 20 minutes counts!"
        return "Great consistency! Keep reviewing your topics and stay ahead of your goals."
