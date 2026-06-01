from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .services import AnalyticsService
from common.responses import success_response


def _trends_to_frontend(trends: list) -> list:
    result = []
    for item in trends:
        date_str = item.get("date", "")
        try:
            from datetime import date as date_cls
            d = date_cls.fromisoformat(date_str)
            name = d.strftime("%b %d")
        except Exception:
            name = date_str
        result.append({
            "name": name,
            "hours": round(item.get("focus_minutes", 0) / 60, 2),
            "date": date_str,
        })
    return result


def _subjects_to_frontend(subjects: list) -> list:
    return [
        {
            "name": item.get("subject", ""),
            "value": round(item.get("minutes", 0) / 60, 2),
            "hours": round(item.get("minutes", 0) / 60, 2),
        }
        for item in subjects
    ]


class StudyTrendsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        raw = AnalyticsService.get_study_trends(request.user, days=min(days, 365))
        return success_response(data=_trends_to_frontend(raw))


class SubjectBreakdownView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        raw = AnalyticsService.get_subject_breakdown(request.user, days=min(days, 365))
        return success_response(data=_subjects_to_frontend(raw))


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
        raw_trends = data.get("study_trends", [])
        raw_subjects = data.get("subject_breakdown", [])
        data["study_trends"] = _trends_to_frontend(raw_trends)
        data["subject_breakdown"] = _subjects_to_frontend(raw_subjects)
        return success_response(data=data)


class RevisionStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = AnalyticsService.get_revision_stats(request.user)
        return success_response(data=data)
