import pytest
from datetime import date, time, timedelta

from apps.planner.models import StudyPlan, StudySession
from apps.planner.serializers import StudyPlanSerializer
from apps.planner.services import PlannerService

pytestmark = pytest.mark.django_db


@pytest.fixture
def study_plan(user):
    plan = StudyPlan.objects.create(
        user=user,
        title="Exam prep",
        plan_type="weekly",
        subjects=["Math", "Physics"],
        start_date=date.today(),
        end_date=date.today() + timedelta(days=7),
    )
    StudySession.objects.create(
        plan=plan,
        subject="Math",
        topic="Algebra",
        scheduled_date=date.today(),
        start_time=time(9, 0),
        end_time=time(10, 0),
        duration_minutes=60,
        status="scheduled",
    )
    StudySession.objects.create(
        plan=plan,
        subject="Physics",
        topic="Motion",
        scheduled_date=date.today() + timedelta(days=1),
        start_time=time(14, 0),
        end_time=time(14, 45),
        duration_minutes=45,
        status="completed",
    )
    return plan


class TestPlannerService:
    def test_list_plans_prefetches_sessions(self, user, study_plan):
        plans = list(PlannerService.get_user_plans(user))
        assert len(plans) == 1
        assert plans[0].sessions.count() == 2


class TestStudyPlanSerializer:
    def test_session_counts_use_prefetch(self, user, study_plan):
        plan = PlannerService.get_plan(user, study_plan.id)
        data = StudyPlanSerializer(plan).data
        assert data["session_count"] == 2
        assert data["completed_sessions"] == 1


class TestPlannerDeleteApi:
    def test_delete_session(self, auth_client, user, study_plan):
        session = study_plan.sessions.first()
        response = auth_client.delete(f"/api/v1/planner/sessions/{session.id}/")
        assert response.status_code == 200
        assert response.data["success"] is True
        assert not StudySession.objects.filter(id=session.id).exists()

    def test_delete_session_not_found(self, auth_client):
        response = auth_client.delete("/api/v1/planner/sessions/00000000-0000-0000-0000-000000000099/")
        assert response.status_code == 404

    def test_delete_session_other_user_forbidden(self, auth_client, second_user, study_plan):
        from rest_framework_simplejwt.tokens import RefreshToken

        other_client = auth_client.__class__()
        refresh = RefreshToken.for_user(second_user)
        other_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
        session = study_plan.sessions.first()
        response = other_client.delete(f"/api/v1/planner/sessions/{session.id}/")
        assert response.status_code == 404
        assert StudySession.objects.filter(id=session.id).exists()

    def test_delete_plan_cascades_sessions(self, auth_client, user, study_plan):
        plan_id = study_plan.id
        session_ids = list(study_plan.sessions.values_list("id", flat=True))
        response = auth_client.delete(f"/api/v1/planner/plans/{plan_id}/")
        assert response.status_code == 200
        assert response.data["success"] is True
        assert not StudyPlan.objects.filter(id=plan_id).exists()
        assert not StudySession.objects.filter(id__in=session_ids).exists()

    def test_delete_plan_other_user_forbidden(self, auth_client, second_user, study_plan):
        from rest_framework_simplejwt.tokens import RefreshToken

        other_client = auth_client.__class__()
        refresh = RefreshToken.for_user(second_user)
        other_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
        response = other_client.delete(f"/api/v1/planner/plans/{study_plan.id}/")
        assert response.status_code == 404
        assert StudyPlan.objects.filter(id=study_plan.id).exists()
