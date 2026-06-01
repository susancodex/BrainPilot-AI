from django.urls import path
from . import views

urlpatterns = [
    path("", views.NoteListView.as_view(), name="notes-list"),
    path("<uuid:pk>/", views.NoteDetailView.as_view(), name="notes-detail"),
    path("<uuid:pk>/summarize/", views.GenerateNoteSummaryView.as_view(), name="notes-summarize"),
    path("<uuid:pk>/flashcards/generate/", views.GenerateFlashcardsView.as_view(), name="notes-flashcards-generate"),
    path("flashcards/", views.FlashcardListView.as_view(), name="flashcards-list"),
    path("flashcards/due/", views.FlashcardDueView.as_view(), name="flashcards-due"),
    path("flashcards/<uuid:pk>/review/", views.FlashcardReviewView.as_view(), name="flashcards-review"),
]
