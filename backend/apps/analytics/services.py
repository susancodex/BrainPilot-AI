import logging
from datetime import timedelta
from django.utils import timezone
from django.db.models import Avg, Sum, Count

logger = logging.getLogger(__name__)


class AnalyticsService:
    @staticmethod
    def get_study_trends(user, days=30):
        from apps.productivity.models import FocusLog
        since = timezone.now().date() - timedelta(days=days)
        logs = FocusLog.objects.filter(user=user, date__gte=since).order_by("date")
        return [
            {
                "date": str(log.date),
                "focus_minutes": log.focus_minutes,
                "productivity_score": log.productivity_score,
                "subjects": log.subjects_studied,
            }
            for log in logs
        ]

    @staticmethod
    def get_subject_breakdown(user, days=30):
        from apps.productivity.models import FocusLog
        since = timezone.now().date() - timedelta(days=days)
        logs = FocusLog.objects.filter(user=user, date__gte=since)
        subject_map = {}
        for log in logs:
            for subject in log.subjects_studied:
                subject_map[subject] = subject_map.get(subject, 0) + log.focus_minutes
        return [{"subject": k, "minutes": v} for k, v in sorted(subject_map.items(), key=lambda x: -x[1])]

    @staticmethod
    def get_quiz_performance(user, days=30):
        from apps.quizzes.models import QuizAttempt
        since = timezone.now() - timedelta(days=days)
        attempts = QuizAttempt.objects.filter(user=user, created_at__gte=since, completed=True)
        stats = attempts.aggregate(
            avg_percentage=Avg("percentage"),
            total_attempts=Count("id"),
            total_questions=Sum("max_score"),
        )
        by_subject = {}
        for attempt in attempts.select_related("quiz"):
            subject = attempt.quiz.subject
            if subject not in by_subject:
                by_subject[subject] = {"total": 0, "correct": 0}
            by_subject[subject]["total"] += attempt.max_score
            by_subject[subject]["correct"] += attempt.score
        return {
            "summary": stats,
            "by_subject": [
                {"subject": k, "accuracy": round(v["correct"] / v["total"] * 100, 1) if v["total"] > 0 else 0}
                for k, v in by_subject.items()
            ],
        }

    @staticmethod
    def get_goal_metrics(user):
        from apps.goals.models import Goal
        from django.db.models import Count
        goals = Goal.objects.filter(user=user)
        by_status = goals.values("status").annotate(count=Count("id"))
        return {
            "total": goals.count(),
            "by_status": list(by_status),
            "avg_progress": goals.aggregate(avg=Avg("progress"))["avg"] or 0,
        }

    @staticmethod
    def get_revision_stats(user):
        from apps.revision.models import RevisionTopic
        from django.utils import timezone
        topics = RevisionTopic.objects.filter(user=user)
        weak = topics.filter(is_weak=True).count()
        due = topics.filter(next_revision_at__lte=timezone.now()).count()
        return {
            "total_topics": topics.count(),
            "due_count": due,
            "weak_topics": weak,
            "avg_confidence": topics.aggregate(avg=Avg("confidence_level"))["avg"] or 0,
            "mastered": topics.filter(confidence_level__gte=4).count(),
        }

    @staticmethod
    def get_performance_report(user, days=30):
        return {
            "study_trends": AnalyticsService.get_study_trends(user, days),
            "subject_breakdown": AnalyticsService.get_subject_breakdown(user, days),
            "quiz_performance": AnalyticsService.get_quiz_performance(user, days),
            "goal_metrics": AnalyticsService.get_goal_metrics(user),
            "revision_stats": AnalyticsService.get_revision_stats(user),
        }
