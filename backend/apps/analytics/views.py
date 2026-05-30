from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .services import AnalyticsService
from common.responses import success_response


class StudyTrendsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        data = AnalyticsService.get_study_trends(request.user, days=min(days, 365))
        return success_response(data=data)


class SubjectBreakdownView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        data = AnalyticsService.get_subject_breakdown(request.user, days=min(days, 365))
        return success_response(data=data)


class QuizPerformanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        data = AnalyticsService.get_quiz_performance(request.user, days=min(days, 365))
        return success_response(data=data)


class PerformanceReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        data = AnalyticsService.get_performance_report(request.user, days=min(days, 365))
        return success_response(data=data)


class RevisionStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = AnalyticsService.get_revision_stats(request.user)
        return success_response(data=data)
