import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

pytestmark = pytest.mark.django_db

MINIMAL_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01"
    b"\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82"
)


def test_avatar_upload_returns_url(auth_client, user):
    png = SimpleUploadedFile("avatar.png", MINIMAL_PNG, content_type="image/png")
    response = auth_client.post(
        "/api/v1/auth/me/profile/avatar/",
        {"avatar": png},
        format="multipart",
    )
    assert response.status_code == 200
    assert response.data["success"] is True
    profile = response.data["data"]
    assert profile["avatar_url"]
    assert "/media/" in profile["avatar_url"]

    me = auth_client.get("/api/v1/auth/me/")
    assert me.data["data"]["profile"]["avatar_url"] == profile["avatar_url"]

    avatar_path = profile["avatar_url"]
    if avatar_path.startswith("http"):
        from urllib.parse import urlparse

        avatar_path = urlparse(avatar_path).path

    media = auth_client.get(avatar_path)
    assert media.status_code == 200
    assert media["Content-Type"].startswith("image/")
