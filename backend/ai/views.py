import logging

from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from common.responses import success_response, error_response

logger = logging.getLogger(__name__)


class AIHealthView(APIView):
    """
    GET /api/v1/ai/health/
    Returns the live health status of every configured AI provider.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            from ai.factory import get_gateway
            report = get_gateway().health_report()
            available = [p for p in report if p["healthy"]]
            return success_response(
                data={
                    "providers": report,
                    "available_count": len(available),
                    "status": "operational" if available else "degraded",
                },
                message="AI Gateway health report",
            )
        except Exception as exc:
            logger.error("AI health check failed: %s", exc)
            return error_response("Failed to retrieve AI health status")
