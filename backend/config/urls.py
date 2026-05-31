from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from apps.accounts.views import HealthCheckView

urlpatterns = [
    path("admin/", admin.site.urls),

    # ── Service health ────────────────────────────────────────────────────────
    path("api/v1/health/", HealthCheckView.as_view(), name="health-check"),

    # ── OpenAPI schema + interactive docs ─────────────────────────────────────
    path("api/schema/", SpectacularAPIView.as_view(), name="api-schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="api-schema"), name="api-swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="api-schema"), name="api-redoc"),

    # ── JWT ───────────────────────────────────────────────────────────────────
    path("api/v1/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # ── Feature apps ──────────────────────────────────────────────────────────
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
]

if settings.DEBUG:
    try:
        import debug_toolbar
        urlpatterns = [path("__debug__/", include(debug_toolbar.urls))] + urlpatterns
    except ImportError:
        pass
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
