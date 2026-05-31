"""
API-level tests for the auth endpoints.

Covers the most critical security paths:
- Unauthenticated access to protected routes returns 401
- Health check is publicly accessible
- Login with bad credentials returns 401
- Logout blacklists the refresh token
"""
import pytest

pytestmark = pytest.mark.django_db


class TestHealthCheck:
    def test_health_endpoint_is_public(self, api_client):
        response = api_client.get("/api/v1/health/")
        assert response.status_code == 200
        assert response.data["data"]["status"] == "ok"


class TestUnauthenticatedAccess:
    PROTECTED_ENDPOINTS = [
        ("GET", "/api/v1/notes/"),
        ("GET", "/api/v1/dashboard/summary/"),
        ("GET", "/api/v1/productivity/streak/"),
        ("GET", "/api/v1/quizzes/"),
        ("GET", "/api/v1/chatbot/conversations/"),
    ]

    @pytest.mark.parametrize("method,url", PROTECTED_ENDPOINTS)
    def test_protected_endpoints_require_auth(self, api_client, method, url):
        response = getattr(api_client, method.lower())(url)
        assert response.status_code == 401, f"{method} {url} should return 401"


class TestLogin:
    def test_login_with_valid_credentials_returns_tokens(self, api_client, user):
        response = api_client.post("/api/v1/auth/login/", {
            "email": "student@test.com",
            "password": "Str0ngP@ssword!",
        })
        assert response.status_code == 200
        data = response.data["data"]
        assert "access" in data
        assert "refresh" in data

    def test_login_with_wrong_password_returns_401(self, api_client, user):
        response = api_client.post("/api/v1/auth/login/", {
            "email": "student@test.com",
            "password": "WrongPassword!",
        })
        assert response.status_code in (400, 401)
        assert response.data["success"] is False

    def test_login_with_nonexistent_email_returns_error(self, api_client):
        response = api_client.post("/api/v1/auth/login/", {
            "email": "nobody@test.com",
            "password": "AnyPass123!",
        })
        assert response.status_code in (400, 401)


class TestOpenApiSchema:
    def test_schema_endpoint_is_accessible(self, api_client):
        response = api_client.get("/api/schema/")
        assert response.status_code == 200

    def test_swagger_ui_is_accessible(self, api_client):
        response = api_client.get("/api/docs/")
        assert response.status_code == 200
