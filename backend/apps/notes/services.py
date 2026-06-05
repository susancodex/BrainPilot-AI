import logging
from datetime import timedelta
from django.utils import timezone
from .models import Note, Flashcard
from common.exceptions import NotFoundError

logger = logging.getLogger(__name__)


class NoteService:
    @staticmethod
    def get_user_notes(user, subject=None, search=None):
        qs = Note.objects.filter(user=user)
        if subject:
            qs = qs.filter(subject__icontains=subject)
        if search:
            qs = qs.filter(title__icontains=search) | qs.filter(content__icontains=search)
        return qs.prefetch_related("flashcards")

    @staticmethod
    def get_note(user, note_id) -> Note:
        try:
            return Note.objects.prefetch_related("flashcards").get(id=note_id, user=user)
        except Note.DoesNotExist:
            raise NotFoundError("Note not found.")

    @staticmethod
    def create_note(user, **data) -> Note:
        return Note.objects.create(user=user, **data)

    @staticmethod
    def generate_summary(note: Note) -> Note:
        """Call Gemini to summarise note content, persist, and return updated note."""
        from services.ai_engine.adapters.gemini_adapter import GeminiAdapter
        from services.ai_engine.prompts.summary_generation import build_summary_prompt

        adapter = GeminiAdapter(user=user)
        summary = adapter.generate_text(build_summary_prompt(note.content))
        note.ai_summary = summary
        note.summary_generated_at = timezone.now()
        note.save(update_fields=["ai_summary", "summary_generated_at"])
        logger.info("Summary generated for note %s (%d chars)", note.id, len(summary))
        return note

    @staticmethod
    def generate_flashcards(user, note: Note, count: int = 5) -> list[Flashcard]:
        """Call Gemini to generate flashcards from note content, persist, and return them."""
        from services.ai_engine.adapters.gemini_adapter import GeminiAdapter
        from services.ai_engine.prompts.summary_generation import build_flashcards_prompt

        adapter = GeminiAdapter(user=user)
        result = adapter.generate_json(build_flashcards_prompt(note.content, count))
        raw_cards = result.get("flashcards", [])

        allowed_fields = {"question", "answer", "difficulty"}
        flashcards = []
        for fc in raw_cards:
            clean = {k: v for k, v in fc.items() if k in allowed_fields}
            if not clean.get("question") or not clean.get("answer"):
                continue
            flashcards.append(
                Flashcard.objects.create(
                    user=user,
                    note=note,
                    subject=note.subject,
                    question=clean["question"],
                    answer=clean["answer"],
                    difficulty=clean.get("difficulty", "medium"),
                )
            )

        logger.info("Generated %d flashcards for note %s", len(flashcards), note.id)
        return flashcards

    @staticmethod
    def save_ai_summary(note: Note, summary: str) -> Note:
        note.ai_summary = summary
        note.summary_generated_at = timezone.now()
        note.save(update_fields=["ai_summary", "summary_generated_at"])
        return note

    @staticmethod
    def save_flashcards(user, note: Note, flashcards_data: list) -> list[Flashcard]:
        created = []
        allowed_fields = {"question", "answer", "difficulty"}
        for fc in flashcards_data:
            clean = {k: v for k, v in fc.items() if k in allowed_fields}
            if not clean.get("question") or not clean.get("answer"):
                continue
            created.append(Flashcard.objects.create(
                user=user,
                note=note,
                subject=note.subject,
                **clean,
            ))
        return created

    @staticmethod
    def get_all_flashcards(user):
        return Flashcard.objects.filter(user=user).select_related("note").order_by("-created_at")

    @staticmethod
    def get_due_flashcards(user):
        return Flashcard.objects.filter(
            user=user,
            next_review_at__lte=timezone.now(),
        ).select_related("note").order_by("next_review_at")

    @staticmethod
    def review_flashcard(user, flashcard_id, correct: bool) -> Flashcard:
        try:
            fc = Flashcard.objects.get(id=flashcard_id, user=user)
        except Flashcard.DoesNotExist:
            raise NotFoundError("Flashcard not found.")

        fc.times_reviewed += 1
        if correct:
            fc.times_correct += 1
        fc.last_reviewed_at = timezone.now()
        # Spaced repetition: correct answers double the interval (max 30 days), wrong resets to 1 day
        interval_days = 1 if not correct else min(2 ** (fc.times_correct - 1), 30)
        fc.next_review_at = timezone.now() + timedelta(days=interval_days)
        fc.save()
        return fc
