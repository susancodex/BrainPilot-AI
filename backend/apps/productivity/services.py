import logging
from datetime import date, timedelta
from django.utils import timezone
from django.db import transaction

from .models import PomodoroSession, StudyStreak, FocusLog
from common.exceptions import NotFoundError

logger = logging.getLogger(__name__)


class ProductivityService:
    @staticmethod
    def start_pomodoro(user, **data) -> PomodoroSession:
        return PomodoroSession.objects.create(user=user, status="active", **data)

    @staticmethod
    def complete_pomodoro(user, session_id, pomodoros_completed) -> PomodoroSession:
        try:
            session = PomodoroSession.objects.get(id=session_id, user=user, status="active")
        except PomodoroSession.DoesNotExist:
            raise NotFoundError("Active pomodoro session not found.")

        session.pomodoros_completed = pomodoros_completed
        session.status = "completed"
        session.ended_at = timezone.now()
        session.total_focus_minutes = pomodoros_completed * session.work_duration_minutes
        session.save()

        ProductivityService._update_focus_log(user, session)
        ProductivityService._update_streak(user)
        return session

    @staticmethod
    @transaction.atomic
    def _update_focus_log(user, session: PomodoroSession) -> FocusLog:
        today = timezone.now().date()
        log, _ = FocusLog.objects.get_or_create(user=user, date=today, defaults={"subjects_studied": []})
        log.focus_minutes += session.total_focus_minutes
        subjects = log.subjects_studied
        if session.subject not in subjects:
            subjects.append(session.subject)
        log.subjects_studied = subjects
        log.productivity_score = min(100, (log.focus_minutes / 240) * 100)
        log.save()
        return log

    @staticmethod
    @transaction.atomic
    def _update_streak(user) -> StudyStreak:
        streak, _ = StudyStreak.objects.get_or_create(user=user)
        today = timezone.now().date()
        if streak.last_study_date == today:
            return streak
        if streak.last_study_date == today - timedelta(days=1):
            streak.current_streak += 1
        else:
            streak.current_streak = 1
        streak.longest_streak = max(streak.longest_streak, streak.current_streak)
        streak.last_study_date = today
        streak.total_study_days += 1
        streak.save()
        return streak

    @staticmethod
    def get_user_sessions(user, status=None):
        qs = PomodoroSession.objects.filter(user=user)
        if status:
            qs = qs.filter(status=status)
        return qs

    @staticmethod
    def get_streak(user) -> StudyStreak:
        streak, _ = StudyStreak.objects.get_or_create(user=user)
        return streak

    @staticmethod
    def get_focus_logs(user, days=30):
        since = timezone.now().date() - timedelta(days=days)
        return FocusLog.objects.filter(user=user, date__gte=since).order_by("date")
