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

    def post(self, request, pk):
        note = NoteService.get_note(request.user, pk)
        note = NoteService.generate_summary(note)
        return success_response(
            data={"summary": note.ai_summary, "generated_at": note.summary_generated_at},
            message="Summary generated.",
        )


class GenerateFlashcardsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        note = NoteService.get_note(request.user, pk)
        serializer = GenerateFlashcardsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        count = serializer.validated_data.get("count", 5)
        flashcards = NoteService.generate_flashcards(request.user, note, count=count)
        return created_response(
            data=FlashcardSerializer(flashcards, many=True).data,
            message=f"{len(flashcards)} flashcard(s) generated.",
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
        return success_response(data=FlashcardSerializer(flashcard).data)

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
