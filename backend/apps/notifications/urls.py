from django.urls import path
from . import views

urlpatterns = [
    path("", views.NotificationListView.as_view(), name="notifications-list"),
    path("<uuid:pk>/read/", views.MarkReadView.as_view(), name="notifications-read"),
    path("read-all/", views.MarkAllReadView.as_view(), name="notifications-read-all"),
]
