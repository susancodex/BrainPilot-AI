from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .models import Note
from .serializers import (
    NoteSerializer, NoteListSerializer, FlashcardSerializer,
    GenerateSummarySerializer, GenerateFlashcardsSerializer,
)
from .services import NoteService
from services.ai_engine.workflows.study_planner_workflow import StudyPlannerWorkflow
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

    def post(self, request, pk):
        note = NoteService.get_note(request.user, pk)
        from services.ai_engine.adapters.gemini_adapter import GeminiAdapter
        from services.ai_engine.prompts.summary_generation import build_summary_prompt
        adapter = GeminiAdapter()
        summary = adapter.generate_text(build_summary_prompt(note.content))
        note = NoteService.save_ai_summary(note, summary)
        return success_response(data={"summary": note.ai_summary}, message="Summary generated.")


class GenerateFlashcardsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        note = NoteService.get_note(request.user, pk)
        count = request.data.get("count", 5)
        from services.ai_engine.adapters.gemini_adapter import GeminiAdapter
        from services.ai_engine.prompts.summary_generation import build_flashcards_prompt
        adapter = GeminiAdapter()
        flashcards_data = adapter.generate_json(build_flashcards_prompt(note.content, count))
        flashcards = NoteService.save_flashcards(request.user, note, flashcards_data.get("flashcards", []))
        return created_response(data=FlashcardSerializer(flashcards, many=True).data, message="Flashcards generated.")


class FlashcardDueView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        flashcards = NoteService.get_due_flashcards(request.user)
        return success_response(data=FlashcardSerializer(flashcards, many=True).data)


class FlashcardReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        correct = request.data.get("correct", False)
        flashcard = NoteService.review_flashcard(request.user, pk, correct)
        return success_response(data=FlashcardSerializer(flashcard).data)
