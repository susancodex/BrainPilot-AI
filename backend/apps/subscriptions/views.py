from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .serializers import SubscriptionSerializer, PlanInfoSerializer
from .services import SubscriptionService
from common.responses import success_response


class CurrentSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sub = SubscriptionService.get_or_create(request.user)
        return success_response(data=SubscriptionSerializer(sub).data)


class PlansListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        plans = SubscriptionService.get_all_plans()
        return success_response(data=plans)
