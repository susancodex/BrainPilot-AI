from django.urls import path
from . import views

urlpatterns = [
    path("", views.GoalListView.as_view(), name="goals-list"),
    path("<uuid:pk>/", views.GoalDetailView.as_view(), name="goals-detail"),
    path("<uuid:pk>/progress/", views.GoalProgressView.as_view(), name="goals-progress"),
    path("<uuid:goal_pk>/milestones/<uuid:milestone_pk>/complete/", views.MilestoneCompleteView.as_view(), name="goals-milestone-complete"),
]
