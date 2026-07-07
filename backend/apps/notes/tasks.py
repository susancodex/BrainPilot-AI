"""
Celery tasks for AI-powered note operations.

All AI operations are moved to background tasks to prevent blocking the API.
"""

import logging
from celery import shared_task
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
from ai.exceptions import (
    RateLimitError,
    TimeoutError,
    AllProvidersUnavailableError,
)
from ai.factory import get_gateway

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def generate_note_summary_task(self, note_id: str) -> dict:
    """
    Generate AI summary for a note asynchronously.
    
    Args:
        note_id: UUID of the note to summarize
        
    Returns:
        Dict with success status and summary text or error
    """
    from apps.notes.models import Note
    
    try:
        note = Note.objects.get(id=note_id)
        
        # Update status to processing
        note.summary_status = "processing"
        note.save(update_fields=["summary_status"])
        
        gateway = get_gateway()
        summary = _generate_summary_with_retry(note.content)
        
        # Update note with summary
        note.summary = summary
        note.summary_status = "completed"
        note.save(update_fields=["summary", "summary_status"])
        
        logger.info(f"Successfully generated summary for note {note_id}")
        return {
            "success": True,
            "note_id": note_id,
            "summary": summary,
        }
        
    except Note.DoesNotExist:
        logger.error(f"Note {note_id} not found")
        return {
            "success": False,
            "note_id": note_id,
            "error": "Note not found",
        }
    except Exception as exc:
        logger.error(f"Failed to generate summary for note {note_id}: {exc}")
        
        # Update status to failed
        try:
            note = Note.objects.get(id=note_id)
            note.summary_status = "failed"
            note.save(update_fields=["summary_status"])
        except Note.DoesNotExist:
            pass
        
        return {
            "success": False,
            "note_id": note_id,
            "error": str(exc),
        }


@shared_task(bind=True, max_retries=3)
def generate_flashcards_task(self, note_id: str) -> dict:
    """
    Generate AI flashcards from a note asynchronously.
    
    Args:
        note_id: UUID of the note to generate flashcards from
        
    Returns:
        Dict with success status and flashcard data or error
    """
    from apps.notes.models import Note, Flashcard
    
    try:
        note = Note.objects.get(id=note_id)
        
        # Update status to processing
        note.flashcards_status = "processing"
        note.save(update_fields=["flashcards_status"])
        
        gateway = get_gateway()
        flashcards_data = _generate_flashcards_with_retry(note.content)
        
        # Create flashcard objects
        created_count = 0
        for card_data in flashcards_data:
            Flashcard.objects.create(
                note=note,
                user=note.user,
                question=card_data["front"],
                answer=card_data["back"],
                next_review_at=None,
            )
            created_count += 1
        
        # Update status to completed
        note.flashcards_status = "completed"
        note.save(update_fields=["flashcards_status"])
        
        logger.info(f"Successfully generated {created_count} flashcards for note {note_id}")
        return {
            "success": True,
            "note_id": note_id,
            "flashcards_count": created_count,
        }
        
    except Note.DoesNotExist:
        logger.error(f"Note {note_id} not found")
        return {
            "success": False,
            "note_id": note_id,
            "error": "Note not found",
        }
    except Exception as exc:
        logger.error(f"Failed to generate flashcards for note {note_id}: {exc}")
        
        # Update status to failed
        try:
            note = Note.objects.get(id=note_id)
            note.flashcards_status = "failed"
            note.save(update_fields=["flashcards_status"])
        except Note.DoesNotExist:
            pass
        
        return {
            "success": False,
            "note_id": note_id,
            "error": str(exc),
        }


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((RateLimitError, TimeoutError)),
    reraise=True,
)
def _generate_summary_with_retry(content: str) -> str:
    """
    Generate summary with automatic retry on rate limits and timeouts.
    
    Args:
        content: Note content to summarize
        
    Returns:
        Generated summary text
    """
    gateway = get_gateway()
    prompt = f"Summarize the following study notes concisely:\n\n{content}"
    return gateway.generate_text(prompt)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((RateLimitError, TimeoutError)),
    reraise=True,
)
def _generate_flashcards_with_retry(content: str) -> list[dict]:
    """
    Generate flashcards with automatic retry on rate limits and timeouts.
    
    Args:
        content: Note content to generate flashcards from
        
    Returns:
        List of flashcard dicts with 'front' and 'back' keys
    """
    import json
    
    gateway = get_gateway()
    prompt = f"""
    Generate 5-10 flashcards from the following study notes.
    Return as JSON array with 'front' (question) and 'back' (answer) keys.
    
    Notes:
    {content}
    
    Response format:
    [
        {{"front": "Question 1", "back": "Answer 1"}},
        {{"front": "Question 2", "back": "Answer 2"}}
    ]
    """
    
    response = gateway.generate_json(prompt)
    
    # Ensure response is a list of flashcard dicts
    if isinstance(response, dict):
        response = [response]
    
    # Validate flashcard structure
    validated_flashcards = []
    for card in response:
        if isinstance(card, dict) and "front" in card and "back" in card:
            validated_flashcards.append({
                "front": str(card["front"]),
                "back": str(card["back"]),
            })
    
    return validated_flashcards


@shared_task
def cleanup_old_flashcards():
    """Remove flashcards that haven't been reviewed in 6 months."""
    from django.utils import timezone
    from datetime import timedelta
    from apps.notes.models import Flashcard
    
    six_months_ago = timezone.now() - timedelta(days=180)
    deleted_count, _ = Flashcard.objects.filter(
        last_reviewed_at__lt=six_months_ago
    ).delete()
    
    logger.info(f"Cleaned up {deleted_count} old flashcards")
    return {"deleted_count": deleted_count}
