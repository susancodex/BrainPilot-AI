import io
import logging
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.parsers import MultiPartParser, FormParser

from .models import StudyPlan, StudySession
from .serializers import StudyPlanSerializer, StudySessionSerializer, GeneratePlanSerializer
from .services import PlannerService
from services.ai_engine.workflows.study_planner_workflow import StudyPlannerWorkflow
from common.responses import success_response, created_response, error_response
from common.exceptions import NotFoundError

logger = logging.getLogger(__name__)


class StudyPlanListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        status_filter = request.query_params.get("status")
        plans = PlannerService.get_user_plans(request.user, status=status_filter)
        return success_response(data=StudyPlanSerializer(plans, many=True).data)

    def post(self, request):
        serializer = StudyPlanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        plan = PlannerService.create_plan(request.user, **serializer.validated_data)
        return created_response(data=StudyPlanSerializer(plan).data)


class StudyPlanDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        plan = PlannerService.get_plan(request.user, pk)
        return success_response(data=StudyPlanSerializer(plan).data)

    def patch(self, request, pk):
        plan = PlannerService.get_plan(request.user, pk)
        serializer = StudyPlanSerializer(plan, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(data=serializer.data, message="Plan updated.")

    def delete(self, request, pk):
        plan = PlannerService.get_plan(request.user, pk)
        plan.delete()
        return success_response(message="Plan deleted.")


class GenerateAIPlanView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = GeneratePlanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        workflow = StudyPlannerWorkflow()
        ai_response = workflow.generate(request.user, serializer.validated_data)
        plan = PlannerService.create_ai_plan(request.user, ai_response, serializer.validated_data)
        return created_response(data=StudyPlanSerializer(plan).data, message="AI study plan generated.")


class ExtractSyllabusView(APIView):
    """Accept a PDF upload or raw text and return extracted syllabus text."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        pdf_file = request.FILES.get("file")
        raw_text = request.data.get("text", "").strip()

        if pdf_file:
            try:
                import pypdf
                content = pdf_file.read()
                reader = pypdf.PdfReader(io.BytesIO(content))
                pages = [page.extract_text() or "" for page in reader.pages]
                extracted = "\n\n".join(pages).strip()
                if not extracted:
                    return error_response("Could not extract text from this PDF. Try pasting the syllabus instead.", status=422)
                return success_response(
                    data={"text": extracted, "pages": len(reader.pages), "source": "pdf"},
                    message="Syllabus extracted from PDF.",
                )
            except ImportError:
                return error_response("PDF processing is not available. Please paste your syllabus as text.", status=503)
            except Exception as exc:
                logger.warning("Syllabus PDF extraction error: %s", exc)
                return error_response("Failed to read PDF. Try pasting the syllabus as text.", status=422)

        if raw_text:
            return success_response(
                data={"text": raw_text, "pages": None, "source": "text"},
                message="Syllabus text received.",
            )

        return error_response("Provide either a PDF file or syllabus text.", status=400)


class StudySessionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        date_filter = request.query_params.get("date")
        sessions = PlannerService.get_user_sessions(request.user, date=date_filter)
        return success_response(data=StudySessionSerializer(sessions, many=True).data)


class StudySessionUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        serializer = StudySessionSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = PlannerService.update_session(request.user, pk, **serializer.validated_data)
        return success_response(data=StudySessionSerializer(updated).data, message="Session updated.")
