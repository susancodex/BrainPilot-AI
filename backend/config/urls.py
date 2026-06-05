from pathlib import Path

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve as media_serve
from django.http import FileResponse, Http404
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from apps.accounts.views import HealthCheckView, ReadinessCheckView, LivenessCheckView

FRONTEND_BUILD_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist" / "public"


def serve_react(request, *args, **kwargs):
    index = FRONTEND_BUILD_DIR / "index.html"
    if not index.exists():
        raise Http404("Frontend build not found. Run: pnpm --filter @workspace/brainpilot-web run build")
    return FileResponse(open(index, "rb"), content_type="text/html")


def serve_asset(request, path, *args, **kwargs):
    asset = FRONTEND_BUILD_DIR / "assets" / path
    if not asset.exists():
        raise Http404(f"Asset not found: {path}")
    content_types = {
        ".js": "application/javascript",
        ".css": "text/css",
        ".map": "application/json",
        ".png": "image/png",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
    }
    suffix = asset.suffix
    ct = content_types.get(suffix, "application/octet-stream")
    return FileResponse(open(asset, "rb"), content_type=ct)


urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/v1/health/", HealthCheckView.as_view(), name="health-check"),
    path("api/v1/ready/", ReadinessCheckView.as_view(), name="readiness-check"),
    path("api/v1/live/", LivenessCheckView.as_view(), name="liveness-check"),

    path("api/schema/", SpectacularAPIView.as_view(), name="api-schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="api-schema"), name="api-swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="api-schema"), name="api-redoc"),

    path("api/v1/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/planner/", include("apps.planner.urls")),
    path("api/v1/goals/", include("apps.goals.urls")),
    path("api/v1/revision/", include("apps.revision.urls")),
    path("api/v1/notes/", include("apps.notes.urls")),
    path("api/v1/quizzes/", include("apps.quizzes.urls")),
    path("api/v1/chatbot/", include("apps.chatbot.urls")),
    path("api/v1/analytics/", include("apps.analytics.urls")),
    path("api/v1/productivity/", include("apps.productivity.urls")),
    path("api/v1/dashboard/", include("apps.dashboard.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
    path("api/v1/ai/", include("ai.urls")),
    path("api/v1/pdfs/", include("apps.pdfs.urls")),
    path("api/v1/subscriptions/", include("apps.subscriptions.urls")),

    re_path(r"^assets/(?P<path>.+)$", serve_asset, name="frontend-asset"),
]

# Uploaded media must be registered before the SPA catch-all.
urlpatterns += [
    re_path(
        r"^media/(?P<path>.*)$",
        media_serve,
        {"document_root": settings.MEDIA_ROOT},
        name="media",
    ),
]

urlpatterns += [
    re_path(r"^.*$", serve_react, name="frontend"),
]

if settings.DEBUG:
    try:
        import debug_toolbar
        urlpatterns = [path("__debug__/", include(debug_toolbar.urls))] + urlpatterns
    except ImportError:
        pass
