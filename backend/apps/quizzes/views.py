from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .serializers import QuizSerializer, QuizAttemptSerializer, GenerateQuizSerializer, SubmitAttemptSerializer
from .services import QuizService
from services.ai_engine.workflows.quiz_workflow import QuizWorkflow
from common.responses import success_response, created_response


class QuizListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        quizzes = QuizService.get_user_quizzes(request.user, subject=request.query_params.get("subject"))
        return success_response(data=QuizSerializer(quizzes, many=True).data)


class GenerateQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = GenerateQuizSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        workflow = QuizWorkflow()
        ai_response = workflow.generate(request.user, serializer.validated_data)
        quiz = QuizService.create_ai_quiz(request.user, ai_response, serializer.validated_data)
        return created_response(data=QuizSerializer(quiz).data, message="Quiz generated.")


class QuizDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        quiz = QuizService.get_quiz(request.user, pk)
        return success_response(data=QuizSerializer(quiz).data)

    def delete(self, request, pk):
        QuizService.get_quiz(request.user, pk).delete()
        return success_response(message="Quiz deleted.")


class SubmitQuizAttemptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        quiz = QuizService.get_quiz(request.user, pk)
        serializer = SubmitAttemptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attempt = QuizService.evaluate_attempt(
            quiz,
            serializer.validated_data["answers"],
            serializer.validated_data["time_taken_seconds"],
            request.user,
        )
        return created_response(data=QuizAttemptSerializer(attempt).data, message="Quiz submitted.")


class QuizAttemptListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        attempts = QuizService.get_user_attempts(request.user, quiz_id=request.query_params.get("quiz_id"))
        return success_response(data=QuizAttemptSerializer(attempts, many=True).data)
