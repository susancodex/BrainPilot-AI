import logging
from .models import Notification
from common.exceptions import NotFoundError

logger = logging.getLogger(__name__)


class NotificationService:
    @staticmethod
    def get_user_notifications(user, unread_only=False):
        qs = Notification.objects.filter(user=user)
        if unread_only:
            qs = qs.filter(is_read=False)
        return qs

    @staticmethod
    def mark_as_read(user, notification_id) -> Notification:
        try:
            notification = Notification.objects.get(id=notification_id, user=user)
        except Notification.DoesNotExist:
            raise NotFoundError("Notification not found.")
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return notification

    @staticmethod
    def mark_all_read(user) -> int:
        return Notification.objects.filter(user=user, is_read=False).update(is_read=True)

    @staticmethod
    def create_notification(user, type: str, title: str, message: str, **kwargs) -> Notification:
        return Notification.objects.create(
            user=user, type=type, title=title, message=message, **kwargs
        )

    @staticmethod
    def get_notification(user, notification_id) -> Notification:
        try:
            return Notification.objects.get(id=notification_id, user=user)
        except Notification.DoesNotExist:
            raise NotFoundError("Notification not found.")

    @staticmethod
    def delete_notification(user, notification_id) -> None:
        notification = NotificationService.get_notification(user, notification_id)
        notification.delete()

    @staticmethod
    def clear_all_notifications(user) -> int:
        deleted_count, _ = Notification.objects.filter(user=user).delete()
        return deleted_count

    @staticmethod
    def get_unread_count(user) -> int:
        return Notification.objects.filter(user=user, is_read=False).count()
