import logging
from celery import shared_task
from ai.exceptions import RateLimitError, TimeoutError

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def generate_study_plan_async(self, user_id: str, request_data: dict):
    try:
        from apps.accounts.models import User
        from apps.planner.services import PlannerService
        from services.ai_engine.workflows.study_planner_workflow import StudyPlannerWorkflow

        user = User.objects.get(id=user_id)
        workflow = StudyPlannerWorkflow()
        ai_response = workflow.generate(user, request_data)
        plan = PlannerService.create_ai_plan(user, ai_response, request_data)
        logger.info("Async study plan created: %s", plan.id)
        return str(plan.id)
    except (RateLimitError, TimeoutError) as exc:
        # Exponential backoff: 2s, 4s, 8s
        logger.warning("Rate limit or timeout on study plan generation, retrying: %s", exc)
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
    except Exception as exc:
        logger.error("Async study plan generation failed: %s", exc)
        raise


@shared_task(bind=True, max_retries=3)
def generate_note_summary_async(self, note_id: str):
    try:
        from apps.notes.models import Note
        from apps.notes.services import NoteService
        from services.ai_engine.adapters.gemini_adapter import GeminiAdapter
        from services.ai_engine.prompts.summary_generation import build_summary_prompt

        note = Note.objects.get(id=note_id)
        adapter = GeminiAdapter()
        summary = adapter.generate_text(build_summary_prompt(note.content))
        NoteService.save_ai_summary(note, summary)
        logger.info("Async note summary generated for: %s", note_id)
    except (RateLimitError, TimeoutError) as exc:
        # Exponential backoff: 2s, 4s, 8s
        logger.warning("Rate limit or timeout on note summary, retrying: %s", exc)
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
    except Exception as exc:
        logger.error("Async note summary failed: %s", exc)
        raise


@shared_task(bind=True)
def send_revision_reminders(self):
    try:
        from django.utils import timezone
        from apps.revision.models import RevisionTopic
        from apps.notifications.services import NotificationService

        due_topics = RevisionTopic.objects.filter(
            next_revision_at__lte=timezone.now()
        ).select_related("user").values("user", "topic", "subject")[:500]

        user_map = {}
        for item in due_topics:
            uid = str(item["user"])
            if uid not in user_map:
                user_map[uid] = []
            user_map[uid].append(f"{item['subject']}: {item['topic']}")

        from apps.accounts.models import User
        for user_id, topics in user_map.items():
            try:
                user = User.objects.get(id=user_id)
                NotificationService.create_notification(
                    user=user,
                    type="revision_due",
                    title=f"{len(topics)} topic(s) due for revision",
                    message=f"Topics due: {', '.join(topics[:3])}{'...' if len(topics) > 3 else ''}",
                )
            except Exception:
                pass
        logger.info("Revision reminders sent to %d users", len(user_map))
    except Exception as exc:
        logger.error("Revision reminder task failed: %s", exc)


@shared_task(bind=True)
def process_analytics(self, user_id: str):
    try:
        from apps.accounts.models import User
        from apps.analytics.services import AnalyticsService
        user = User.objects.get(id=user_id)
        AnalyticsService.get_performance_report(user)
        logger.info("Analytics processed for user: %s", user_id)
    except Exception as exc:
        logger.error("Analytics processing failed: %s", exc)
