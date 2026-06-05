from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .serializers import (
    PomodoroSessionSerializer, StudyStreakSerializer, FocusLogSerializer,
    CompletePomodoroSerializer, LogSessionSerializer, SessionCompleteResponseSerializer,
)
from .services import ProductivityService
from common.responses import success_response, created_response


class PomodoroListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = ProductivityService.get_user_sessions(request.user, status=request.query_params.get("status"))
        return success_response(data=PomodoroSessionSerializer(sessions, many=True).data)

    def post(self, request):
        serializer = PomodoroSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = ProductivityService.start_pomodoro(request.user, **serializer.validated_data)
        return created_response(data=PomodoroSessionSerializer(session).data, message="Pomodoro session started.")


class PomodoroDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            from .models import PomodoroSession
            session = PomodoroSession.objects.get(id=pk, user=request.user)
        except Exception:
            from common.exceptions import NotFoundError
            raise NotFoundError("Pomodoro session not found.")
        return success_response(data=PomodoroSessionSerializer(session).data)

    def patch(self, request, pk):
        try:
            from .models import PomodoroSession
            session = PomodoroSession.objects.get(id=pk, user=request.user)
        except Exception:
            from common.exceptions import NotFoundError
            raise NotFoundError("Pomodoro session not found.")
        serializer = PomodoroSessionSerializer(session, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(data=PomodoroSessionSerializer(session).data)

    def delete(self, request, pk):
        try:
            from .models import PomodoroSession
            session = PomodoroSession.objects.get(id=pk, user=request.user)
        except Exception:
            from common.exceptions import NotFoundError
            raise NotFoundError("Pomodoro session not found.")
        session.delete()
        return success_response(message="Pomodoro session deleted.")


class CompletePomodoroView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        serializer = CompletePomodoroSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = ProductivityService.complete_pomodoro(
            request.user, pk, serializer.validated_data["pomodoros_completed"]
        )
        return success_response(data=PomodoroSessionSerializer(session).data, message="Pomodoro completed.")


class StreakView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        streak = ProductivityService.get_streak(request.user)
        return success_response(data=StudyStreakSerializer(streak).data)


class SessionCompleteView(APIView):
    """
    POST /api/v1/productivity/sessions/complete/

    Log a completed study session without a pre-existing Pomodoro timer.
    Atomically creates a session record, updates today's focus log, and
    increments the user's streak. Returns all three in one response.

    Body: { "subject": "Maths", "focus_minutes": 45, "task_description": "..." }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = ProductivityService.log_session(request.user, **serializer.validated_data)
        data = SessionCompleteResponseSerializer(result).data
        return created_response(
            data=data,
            message=f"Session logged. Current streak: {result['streak'].current_streak} day(s).",
        )


class FocusLogListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        logs = ProductivityService.get_focus_logs(request.user, days=min(days, 365))
        return success_response(data=FocusLogSerializer(logs, many=True).data)
