from django.urls import path
from .views import CurrentSubscriptionView, PlansListView

urlpatterns = [
    path("", CurrentSubscriptionView.as_view(), name="subscription-current"),
    path("plans/", PlansListView.as_view(), name="subscription-plans"),
]
