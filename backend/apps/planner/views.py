import logging
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView

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


class StudySessionUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        session = PlannerService.update_session(request.user, pk, **request.data)
        return success_response(data=StudySessionSerializer(session).data, message="Session updated.")
