from django.urls import path
from . import views

urlpatterns = [
    path("conversations/", views.ConversationListView.as_view(), name="chatbot-conversations"),
    path("conversations/<uuid:pk>/", views.ConversationDetailView.as_view(), name="chatbot-conversation-detail"),
    path("send/", views.SendMessageView.as_view(), name="chatbot-send"),
    path("send/stream/", views.StreamMessageView.as_view(), name="chatbot-send-stream"),
]
