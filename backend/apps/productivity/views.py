from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .serializers import PomodoroSessionSerializer, StudyStreakSerializer, FocusLogSerializer, CompletePomodороSerializer
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


class CompletePomodoroView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        serializer = CompletePomodороSerializer(data=request.data)
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


class FocusLogListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        logs = ProductivityService.get_focus_logs(request.user, days=min(days, 365))
        return success_response(data=FocusLogSerializer(logs, many=True).data)
