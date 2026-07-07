from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .models import Note
from .serializers import (
    NoteSerializer, NoteListSerializer, FlashcardSerializer,
    GenerateFlashcardsSerializer, CreateFlashcardSerializer, UpdateFlashcardSerializer,
)
from .services import NoteService
from common.responses import success_response, created_response


class NoteListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notes = NoteService.get_user_notes(
            request.user,
            subject=request.query_params.get("subject"),
            search=request.query_params.get("search"),
        )
        return success_response(data=NoteListSerializer(notes, many=True).data)

    def post(self, request):
        serializer = NoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note = NoteService.create_note(request.user, **serializer.validated_data)
        return created_response(data=NoteSerializer(note).data)


class NoteDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        note = NoteService.get_note(request.user, pk)
        return success_response(data=NoteSerializer(note).data)

    def patch(self, request, pk):
        note = NoteService.get_note(request.user, pk)
        serializer = NoteSerializer(note, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(data=serializer.data)

    def delete(self, request, pk):
        NoteService.get_note(request.user, pk).delete()
        return success_response(message="Note deleted.")


class GenerateNoteSummaryView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = "ai_generate"

    def post(self, request, pk):
        note = NoteService.get_note(request.user, pk)
        
        # Trigger async task instead of synchronous call
        from .tasks import generate_note_summary_task
        task = generate_note_summary_task.delay(str(note.id))
        
        # Update status to pending
        note.summary_status = "processing"
        note.save(update_fields=["summary_status"])
        
        return success_response(
            data={
                "task_id": task.id,
                "status": "processing",
                "note_id": str(note.id),
            },
            message="Summary generation started. Check status later.",
        )


class GenerateFlashcardsView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = "ai_generate"

    def post(self, request, pk):
        note = NoteService.get_note(request.user, pk)
        
        # Trigger async task instead of synchronous call
        from .tasks import generate_flashcards_task
        task = generate_flashcards_task.delay(str(note.id))
        
        # Update status to pending
        note.flashcards_status = "processing"
        note.save(update_fields=["flashcards_status"])
        
        return success_response(
            data={
                "task_id": task.id,
                "status": "processing",
                "note_id": str(note.id),
            },
            message="Flashcard generation started. Check status later.",
        )


class FlashcardListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        flashcards = NoteService.get_all_flashcards(request.user)
        return success_response(data=FlashcardSerializer(flashcards, many=True).data)

    def post(self, request):
        serializer = CreateFlashcardSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        flashcard = NoteService.create_flashcard(request.user, **serializer.validated_data)
        return created_response(data=FlashcardSerializer(flashcard).data, message="Flashcard created.")


class FlashcardDueView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        flashcards = NoteService.get_due_flashcards(request.user)
        return success_response(data=FlashcardSerializer(flashcards, many=True).data)


class FlashcardDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        flashcard = NoteService.get_flashcard(request.user, pk)
        return success_response(data=FlashcardSerializer(flashcard).data)

    def patch(self, request, pk):
        flashcard = NoteService.get_flashcard(request.user, pk)
        serializer = UpdateFlashcardSerializer(flashcard, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(data=FlashcardSerializer(serializer.instance).data)

    def delete(self, request, pk):
        NoteService.get_flashcard(request.user, pk).delete()
        return success_response(message="Flashcard deleted.")


class FlashcardReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        result = request.data.get("result", "")
        correct_flag = request.data.get("correct", None)
        if result:
            correct = result == "correct"
        elif correct_flag is not None:
            correct = bool(correct_flag)
        else:
            correct = False
        flashcard = NoteService.review_flashcard(request.user, pk, correct)
        return success_response(data=FlashcardSerializer(flashcard).data)


class AITaskStatusView(APIView):
    """Check the status of async AI generation tasks."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """Get the status of AI operations for a note."""
        note = NoteService.get_note(request.user, pk)
        
        return success_response(
            data={
                "note_id": str(note.id),
                "summary_status": note.summary_status,
                "flashcards_status": note.flashcards_status,
                "has_summary": bool(note.ai_summary),
                "flashcard_count": note.flashcards.count() if hasattr(note, 'flashcards') else 0,
            }
        )
