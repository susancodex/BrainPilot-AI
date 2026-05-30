from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .services import DashboardService
from common.responses import success_response


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = DashboardService.get_dashboard_summary(request.user)
        return success_response(data=data)
