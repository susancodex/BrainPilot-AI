import logging
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
    def save_ai_summary(note: Note, summary: str) -> Note:
        note.ai_summary = summary
        note.summary_generated_at = timezone.now()
        note.save(update_fields=["ai_summary", "summary_generated_at"])
        return note

    @staticmethod
    def save_flashcards(user, note: Note, flashcards_data: list) -> list[Flashcard]:
        created = []
        for fc in flashcards_data:
            flashcard = Flashcard.objects.create(
                user=user,
                note=note,
                subject=note.subject,
                **fc,
            )
            created.append(flashcard)
        return created

    @staticmethod
    def get_due_flashcards(user):
        return Flashcard.objects.filter(
            user=user,
            next_review_at__lte=timezone.now(),
        ).order_by("next_review_at")

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
        interval_days = 1 if not correct else min(2 ** (fc.times_correct - 1), 30)
        from datetime import timedelta
        fc.next_review_at = timezone.now() + timedelta(days=interval_days)
        fc.save()
        return fc
