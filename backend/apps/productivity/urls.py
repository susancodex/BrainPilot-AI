from django.urls import path
from . import views

urlpatterns = [
    path("pomodoro/", views.PomodoroListView.as_view(), name="productivity-pomodoro"),
    path("pomodoro/<uuid:pk>/complete/", views.CompletePomodoroView.as_view(), name="productivity-pomodoro-complete"),
    path("streak/", views.StreakView.as_view(), name="productivity-streak"),
    path("focus-logs/", views.FocusLogListView.as_view(), name="productivity-focus-logs"),
]
