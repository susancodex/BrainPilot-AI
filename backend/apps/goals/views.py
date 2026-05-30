from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .serializers import GoalSerializer, GoalMilestoneSerializer
from .services import GoalService
from common.responses import success_response, created_response


class GoalListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        goals = GoalService.get_user_goals(
            request.user,
            status=request.query_params.get("status"),
            category=request.query_params.get("category"),
        )
        return success_response(data=GoalSerializer(goals, many=True).data)

    def post(self, request):
        serializer = GoalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        goal = GoalService.create_goal(request.user, **serializer.validated_data)
        return created_response(data=GoalSerializer(goal).data)


class GoalDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        goal = GoalService.get_goal(request.user, pk)
        return success_response(data=GoalSerializer(goal).data)

    def patch(self, request, pk):
        goal = GoalService.get_goal(request.user, pk)
        serializer = GoalSerializer(goal, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(data=serializer.data)

    def delete(self, request, pk):
        GoalService.get_goal(request.user, pk).delete()
        return success_response(message="Goal deleted.")


class GoalProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        progress = request.data.get("progress", 0)
        goal = GoalService.update_goal_progress(request.user, pk, progress)
        return success_response(data=GoalSerializer(goal).data)


class MilestoneCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, goal_pk, milestone_pk):
        milestone = GoalService.complete_milestone(request.user, goal_pk, milestone_pk)
        return success_response(data=GoalMilestoneSerializer(milestone).data)
