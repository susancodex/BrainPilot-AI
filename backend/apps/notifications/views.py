from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .serializers import NotificationSerializer
from .services import NotificationService
from common.responses import success_response, created_response


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        unread_only = request.query_params.get("unread_only") == "true"
        notifications = NotificationService.get_user_notifications(request.user, unread_only=unread_only)
        unread_count = NotificationService.get_unread_count(request.user)
        return success_response(data={
            "unread_count": unread_count,
            "notifications": NotificationSerializer(notifications, many=True).data,
        })


class MarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        notification = NotificationService.mark_as_read(request.user, pk)
        return success_response(data=NotificationSerializer(notification).data)


class MarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        count = NotificationService.mark_all_read(request.user)
        return success_response(message=f"Marked {count} notifications as read.")


class NotificationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        NotificationService.delete_notification(request.user, pk)
        return success_response(message="Notification deleted.")


class ClearAllNotificationsView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        count = NotificationService.clear_all_notifications(request.user)
        return success_response(message=f"Deleted {count} notification(s).")
