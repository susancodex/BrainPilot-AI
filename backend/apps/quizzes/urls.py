from django.urls import path
from . import views

urlpatterns = [
    path("", views.QuizListView.as_view(), name="quizzes-list"),
    path("generate/", views.GenerateQuizView.as_view(), name="quizzes-generate"),
    path("<uuid:pk>/", views.QuizDetailView.as_view(), name="quizzes-detail"),
    path("<uuid:pk>/submit/", views.SubmitQuizAttemptView.as_view(), name="quizzes-submit"),
    path("attempts/", views.QuizAttemptListView.as_view(), name="quizzes-attempts"),
]
