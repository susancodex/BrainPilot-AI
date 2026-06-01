from django.urls import path
from .views import (
    PDFListView,
    PDFDetailView,
    PDFChatView,
    PDFHighlightListView,
    PDFHighlightDeleteView,
)

urlpatterns = [
    path("", PDFListView.as_view(), name="pdf-list"),
    path("<uuid:pk>/", PDFDetailView.as_view(), name="pdf-detail"),
    path("<uuid:pk>/chat/", PDFChatView.as_view(), name="pdf-chat"),
    path("<uuid:pk>/highlights/", PDFHighlightListView.as_view(), name="pdf-highlights"),
    path("<uuid:pk>/highlights/<uuid:highlight_id>/", PDFHighlightDeleteView.as_view(), name="pdf-highlight-delete"),
]
