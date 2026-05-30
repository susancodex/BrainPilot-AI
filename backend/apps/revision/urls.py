from django.urls import path
from . import views

urlpatterns = [
    path("topics/", views.RevisionTopicListView.as_view(), name="revision-topics"),
    path("topics/due/", views.DueRevisionTopicsView.as_view(), name="revision-due"),
    path("topics/weak/", views.WeakTopicsView.as_view(), name="revision-weak"),
    path("record/", views.RecordRevisionView.as_view(), name="revision-record"),
]
