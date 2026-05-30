from django.urls import path
from . import views

urlpatterns = [
    path("plans/", views.StudyPlanListView.as_view(), name="planner-plans"),
    path("plans/generate/", views.GenerateAIPlanView.as_view(), name="planner-generate"),
    path("plans/<uuid:pk>/", views.StudyPlanDetailView.as_view(), name="planner-plan-detail"),
    path("sessions/", views.StudySessionListView.as_view(), name="planner-sessions"),
    path("sessions/<uuid:pk>/", views.StudySessionUpdateView.as_view(), name="planner-session-update"),
]
