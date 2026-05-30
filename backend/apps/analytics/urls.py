from django.urls import path
from . import views

urlpatterns = [
    path("trends/", views.StudyTrendsView.as_view(), name="analytics-trends"),
    path("subjects/", views.SubjectBreakdownView.as_view(), name="analytics-subjects"),
    path("quiz-performance/", views.QuizPerformanceView.as_view(), name="analytics-quiz"),
    path("revision/", views.RevisionStatsView.as_view(), name="analytics-revision"),
    path("report/", views.PerformanceReportView.as_view(), name="analytics-report"),
]
