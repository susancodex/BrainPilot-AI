from django.urls import path
from . import views

urlpatterns = [
    path("", views.NotificationListView.as_view(), name="notifications-list"),
    path("read-all/", views.MarkAllReadView.as_view(), name="notifications-read-all"),
    path("clear-all/", views.ClearAllNotificationsView.as_view(), name="notifications-clear-all"),
    path("<uuid:pk>/read/", views.MarkReadView.as_view(), name="notifications-read"),
    path("<uuid:pk>/", views.NotificationDetailView.as_view(), name="notifications-detail"),
]
