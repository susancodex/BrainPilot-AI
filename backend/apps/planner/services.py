import logging
from datetime import date, timedelta
from django.db import transaction

from .models import StudyPlan, StudySession
from common.exceptions import NotFoundError, ForbiddenError

logger = logging.getLogger(__name__)


class PlannerService:
    @staticmethod
    def get_user_plans(user, status=None):
        qs = StudyPlan.objects.filter(user=user).prefetch_related("sessions")
        if status:
            qs = qs.filter(status=status)
        return qs

    @staticmethod
    def get_plan(user, plan_id):
        try:
            return StudyPlan.objects.prefetch_related("sessions").get(id=plan_id, user=user)
        except StudyPlan.DoesNotExist:
            raise NotFoundError("Study plan not found.")

    @staticmethod
    @transaction.atomic
    def create_plan(user, **data) -> StudyPlan:
        sessions_data = data.pop("sessions", [])
        plan = StudyPlan.objects.create(user=user, **data)
        for session_data in sessions_data:
            StudySession.objects.create(plan=plan, **session_data)
        return plan

    @staticmethod
    @transaction.atomic
    def create_ai_plan(user, ai_response: dict, request_data: dict) -> StudyPlan:
        plan = StudyPlan.objects.create(
            user=user,
            title=ai_response.get("title", "AI Study Plan"),
            plan_type=request_data["plan_type"],
            subjects=request_data["subjects"],
            start_date=request_data["start_date"],
            end_date=request_data["end_date"],
            total_hours=ai_response.get("total_hours", 0),
            ai_generated=True,
            ai_context=request_data,
            status="active",
        )
        for session in ai_response.get("sessions", []):
            StudySession.objects.create(
                plan=plan,
                subject=session["subject"],
                topic=session["topic"],
                scheduled_date=session["date"],
                start_time=session["start_time"],
                end_time=session["end_time"],
                duration_minutes=session["duration_minutes"],
            )
        logger.info("AI study plan created for user %s with %d sessions", user.email, plan.sessions.count())
        return plan

    @staticmethod
    def update_session(user, session_id, **data) -> StudySession:
        try:
            session = StudySession.objects.select_related("plan").get(id=session_id, plan__user=user)
        except StudySession.DoesNotExist:
            raise NotFoundError("Study session not found.")
        for key, value in data.items():
            setattr(session, key, value)
        session.save()
        return session

    @staticmethod
    def get_user_sessions(user, date=None):
        qs = StudySession.objects.filter(plan__user=user).select_related("plan")
        if date:
            qs = qs.filter(scheduled_date=date)
        return qs

    @staticmethod
    def reschedule_session(user, session_id, new_date: date) -> StudySession:
        try:
            session = StudySession.objects.select_related("plan").get(id=session_id, plan__user=user)
        except StudySession.DoesNotExist:
            raise NotFoundError("Study session not found.")
        session.rescheduled_to = new_date
        session.status = "rescheduled"
        session.save(update_fields=["rescheduled_to", "status"])
        return session
