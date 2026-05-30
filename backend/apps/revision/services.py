import logging
from datetime import timedelta
from django.utils import timezone
from .models import RevisionTopic, RevisionSession
from common.exceptions import NotFoundError

logger = logging.getLogger(__name__)

SPACED_REPETITION_INTERVALS = {1: 1, 2: 3, 3: 7, 4: 14, 5: 30}


class RevisionService:
    @staticmethod
    def get_user_topics(user, subject=None, weak_only=False):
        qs = RevisionTopic.objects.filter(user=user)
        if subject:
            qs = qs.filter(subject__icontains=subject)
        if weak_only:
            qs = qs.filter(is_weak=True)
        return qs

    @staticmethod
    def get_due_topics(user):
        return RevisionTopic.objects.filter(
            user=user,
            next_revision_at__lte=timezone.now(),
        ).order_by("next_revision_at")

    @staticmethod
    def get_topic(user, topic_id) -> RevisionTopic:
        try:
            return RevisionTopic.objects.get(id=topic_id, user=user)
        except RevisionTopic.DoesNotExist:
            raise NotFoundError("Revision topic not found.")

    @staticmethod
    def create_topic(user, **data) -> RevisionTopic:
        return RevisionTopic.objects.create(
            user=user,
            next_revision_at=timezone.now(),
            **data,
        )

    @staticmethod
    def record_revision(user, topic_id, duration_minutes, confidence_after, notes="") -> RevisionSession:
        topic = RevisionService.get_topic(user, topic_id)
        confidence_before = topic.confidence_level

        session = RevisionSession.objects.create(
            user=user,
            topic=topic,
            duration_minutes=duration_minutes,
            confidence_before=confidence_before,
            confidence_after=confidence_after,
            notes=notes,
        )

        interval_days = SPACED_REPETITION_INTERVALS.get(confidence_after, 7)
        topic.confidence_level = confidence_after
        topic.revision_count += 1
        topic.last_revised_at = timezone.now()
        topic.next_revision_at = timezone.now() + timedelta(days=interval_days)
        topic.is_weak = confidence_after <= 2
        topic.save()
        logger.info("Revision recorded for topic %s, next review in %d days", topic.topic, interval_days)
        return session

    @staticmethod
    def detect_weak_topics(user) -> list:
        return list(RevisionTopic.objects.filter(user=user, confidence_level__lte=2, is_weak=True))
