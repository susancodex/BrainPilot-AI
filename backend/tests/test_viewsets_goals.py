"""
Comprehensive tests for Goals ViewSet endpoints.

Tests goal CRUD operations and progress tracking.
"""

import pytest
from rest_framework import status
from apps.goals.models import Goal


@pytest.mark.django_db
class TestGoalsViewSet:
    """Test goals CRUD operations and progress tracking."""

    def test_list_goals_authenticated(self, auth_client, user):
        """Test listing goals when authenticated."""
        response = auth_client.get("/api/v1/goals/")
        assert response.status_code == status.HTTP_200_OK

    def test_list_goals_unauthenticated(self, api_client):
        """Test listing goals when not authenticated."""
        response = api_client.get("/api/v1/goals/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_goal_success(self, auth_client, user):
        """Test successful goal creation."""
        response = auth_client.post(
            "/api/v1/goals/",
            {
                "title": "Complete Physics Course",
                "description": "Finish all physics modules",
                "target_date": "2024-12-31",
                "progress": 0,
                "category": "academic",
                "priority": "high",
            },
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["data"]["title"] == "Complete Physics Course"

    def test_create_goal_unauthenticated(self, api_client):
        """Test goal creation when not authenticated."""
        response = api_client.post(
            "/api/v1/goals/",
            {"title": "Test Goal", "target_date": "2024-12-31"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_retrieve_own_goal(self, auth_client, user):
        """Test retrieving own goal."""
        from apps.goals.models import Goal
        
        goal = Goal.objects.create(
            user=user,
            title="Test Goal",
            target_date="2024-12-31",
            progress=0,
        )
        
        response = auth_client.get(f"/api/v1/goals/{goal.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"]["id"] == str(goal.id)

    def test_retrieve_other_user_goal(self, auth_client, second_user):
        """Test retrieving another user's goal (should fail)."""
        from apps.goals.models import Goal
        
        other_goal = Goal.objects.create(
            user=second_user,
            title="Other User Goal",
            target_date="2024-12-31",
            progress=0,
        )
        
        response = auth_client.get(f"/api/v1/goals/{other_goal.id}/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_own_goal(self, auth_client, user):
        """Test updating own goal."""
        from apps.goals.models import Goal
        
        goal = Goal.objects.create(
            user=user,
            title="Test Goal",
            target_date="2024-12-31",
            progress=0,
        )
        
        response = auth_client.patch(
            f"/api/v1/goals/{goal.id}/",
            {"progress": 50},
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"]["progress"] == 50

    def test_update_other_user_goal(self, auth_client, second_user):
        """Test updating another user's goal (should fail)."""
        from apps.goals.models import Goal
        
        other_goal = Goal.objects.create(
            user=second_user,
            title="Other User Goal",
            target_date="2024-12-31",
            progress=0,
        )
        
        response = auth_client.patch(
            f"/api/v1/goals/{other_goal.id}/",
            {"progress": 100},
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_own_goal(self, auth_client, user):
        """Test deleting own goal."""
        from apps.goals.models import Goal
        
        goal = Goal.objects.create(
            user=user,
            title="Test Goal",
            target_date="2024-12-31",
            progress=0,
        )
        
        response = auth_client.delete(f"/api/v1/goals/{goal.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert not Goal.objects.filter(id=goal.id).exists()

    def test_delete_other_user_goal(self, auth_client, second_user):
        """Test deleting another user's goal (should fail)."""
        from apps.goals.models import Goal
        
        other_goal = Goal.objects.create(
            user=second_user,
            title="Other User Goal",
            target_date="2024-12-31",
            progress=0,
        )
        
        response = auth_client.delete(f"/api/v1/goals/{other_goal.id}/")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert Goal.objects.filter(id=other_goal.id).exists()

    def test_filter_goals_by_status(self, auth_client, user):
        """Test filtering goals by status."""
        from apps.goals.models import Goal
        
        Goal.objects.create(
            user=user,
            title="Active Goal",
            target_date="2024-12-31",
            progress=50,
            status="in_progress",
        )
        Goal.objects.create(
            user=user,
            title="Completed Goal",
            target_date="2024-12-31",
            progress=100,
            status="completed",
        )
        
        response = auth_client.get("/api/v1/goals/?status=in_progress")
        assert response.status_code == status.HTTP_200_OK
        assert all(g["status"] == "in_progress" for g in response.data["data"])

    def test_goal_deadline_validation(self, auth_client, user):
        """Test that past dates are accepted (no validation in current model)."""
        response = auth_client.post(
            "/api/v1/goals/",
            {
                "title": "Past Goal",
                "target_date": "2020-01-01",
                "progress": 0,
            },
        )
        # Current model doesn't validate past dates, so it should succeed
        assert response.status_code == status.HTTP_201_CREATED

    def test_search_goals(self, auth_client, user):
        """Test searching goals by title or description."""
        from apps.goals.models import Goal
        
        Goal.objects.create(
            user=user,
            title="Physics Study Goal",
            description="Complete physics course",
            target_date="2024-12-31",
            progress=0,
        )
        
        response = auth_client.get("/api/v1/goals/?search=physics")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["data"]) > 0
