import pytest

pytestmark = pytest.mark.django_db


def test_register_returns_tokens(api_client):
    email = "new-user-register@test.com"
    response = api_client.post(
        "/api/v1/auth/register/",
        {
            "email": email,
            "first_name": "New",
            "last_name": "User",
            "password": "Str0ngP@ssword!",
            "password_confirm": "Str0ngP@ssword!",
        },
    )
    assert response.status_code == 201
    assert response.data["success"] is True
    data = response.data["data"]
    assert "access" in data
    assert "refresh" in data
    assert data["user"]["email"] == email


def test_register_duplicate_email_message(api_client, user):
    response = api_client.post(
        "/api/v1/auth/register/",
        {
            "email": user.email,
            "first_name": "Dup",
            "last_name": "User",
            "password": "Str0ngP@ssword!",
            "password_confirm": "Str0ngP@ssword!",
        },
    )
    assert response.status_code == 400
    assert response.data["success"] is False
    assert "already registered" in response.data["message"].lower()
