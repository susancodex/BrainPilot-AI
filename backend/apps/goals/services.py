import logging
from django.utils import timezone
from .models import Goal, GoalMilestone
from common.exceptions import NotFoundError

logger = logging.getLogger(__name__)


class GoalService:
    @staticmethod
    def get_user_goals(user, status=None, category=None):
        qs = Goal.objects.filter(user=user).prefetch_related("milestone_items")
        if status:
            qs = qs.filter(status=status)
        if category:
            qs = qs.filter(category=category)
        return qs

    @staticmethod
    def get_goal(user, goal_id) -> Goal:
        try:
            return Goal.objects.prefetch_related("milestone_items").get(id=goal_id, user=user)
        except Goal.DoesNotExist:
            raise NotFoundError("Goal not found.")

    @staticmethod
    def create_goal(user, **data) -> Goal:
        return Goal.objects.create(user=user, **data)

    @staticmethod
    def update_goal_progress(user, goal_id, progress: int) -> Goal:
        goal = GoalService.get_goal(user, goal_id)
        goal.progress = min(100, max(0, progress))
        if goal.progress == 100:
            goal.status = "completed"
        elif goal.progress > 0:
            goal.status = "in_progress"
        goal.save(update_fields=["progress", "status"])
        return goal

    @staticmethod
    def complete_milestone(user, goal_id, milestone_id) -> GoalMilestone:
        goal = GoalService.get_goal(user, goal_id)
        try:
            milestone = goal.milestone_items.get(id=milestone_id)
        except GoalMilestone.DoesNotExist:
            raise NotFoundError("Milestone not found.")
        milestone.completed = True
        milestone.completed_at = timezone.now()
        milestone.save(update_fields=["completed", "completed_at"])
        total = goal.milestone_items.count()
        completed = goal.milestone_items.filter(completed=True).count()
        if total > 0:
            GoalService.update_goal_progress(user, goal_id, int((completed / total) * 100))
        return milestone
