"""
Security middleware for enhanced HTTP security headers.

Adds Content Security Policy, HSTS, X-Frame-Options, and other security headers.
"""

import logging
from django.conf import settings
from django.http import HttpResponse

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware:
    """
    Adds security headers to all HTTP responses.
    
    Headers added:
    - Content-Security-Policy: Restricts resource loading
    - X-Frame-Options: Prevents clickjacking
    - X-Content-Type-Options: Prevents MIME sniffing
    - Referrer-Policy: Controls referrer information
    - Permissions-Policy: Controls browser features
    - Strict-Transport-Security: Enforces HTTPS (production only)
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Skip for non-HTML responses
        if not self._is_html_response(response):
            return response

        # Content Security Policy
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data:",
            "connect-src 'self' https://*.googleapis.com https://*.gstatic.com",
            "media-src 'self' blob:",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
        ]
        
        if settings.DEBUG:
            csp_directives.append("script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:*")
            csp_directives.append("connect-src 'self' http://localhost:* ws://localhost:*")
        
        response["Content-Security-Policy"] = "; ".join(csp_directives)

        # X-Frame-Options (legacy, but still useful)
        response["X-Frame-Options"] = "DENY"

        # X-Content-Type-Options
        response["X-Content-Type-Options"] = "nosniff"

        # Referrer-Policy
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions-Policy (formerly Feature-Policy)
        permissions_directives = [
            "geolocation=()",
            "microphone=()",
            "camera=()",
            "payment=()",
            "usb=()",
            "magnetometer=()",
            "gyroscope=()",
            "accelerometer=()",
        ]
        response["Permissions-Policy"] = ", ".join(permissions_directives)

        # Strict-Transport-Security (only in production)
        if not settings.DEBUG:
            hsts_max_age = 31536000  # 1 year
            response["Strict-Transport-Security"] = (
                f"max-age={hsts_max_age}; includeSubDomains; preload"
            )

        # X-XSS-Protection (legacy, but still useful for older browsers)
        response["X-XSS-Protection"] = "1; mode=block"

        return response

    def _is_html_response(self, response: HttpResponse) -> bool:
        """Check if the response is HTML content."""
        content_type = response.get("Content-Type", "")
        return "text/html" in content_type or "application/xhtml+xml" in content_type


class RequestLoggingMiddleware:
    """
    Logs HTTP requests and responses for debugging and monitoring.
    
    Logs:
    - Request method and path
    - Response status code
    - Request duration
    - User ID (if authenticated)
    - Client IP
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        import time
        
        # Skip logging for health checks
        if getattr(request, 'skip_logging', False):
            return self.get_response(request)
        
        start_time = time.time()
        
        response = self.get_response(request)
        
        duration = time.time() - start_time
        
        user_id = getattr(request.user, "id", "anonymous")
        client_ip = self._get_client_ip(request)
        
        # Log slow requests (> 1 second) as warnings
        log_level = logger.warning if duration > 1.0 else logger.info
        
        log_level(
            "Request: %s %s | Status: %d | Duration: %.3fs | User: %s | IP: %s",
            request.method,
            request.path,
            response.status_code,
            duration,
            user_id,
            client_ip,
        )
        
        return response

    def _get_client_ip(self, request):
        """Extract client IP from request headers."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')


class HealthCheckMiddleware:
    """
    Bypasses authentication and rate limiting for health check endpoints.
    
    Allows health checks to work even when the system is under load.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        health_paths = [
            "/health/",
            "/api/v1/health/",
            "/api/v1/ready/",
            "/api/v1/live/",
            "/api/v1/ai/health/",
        ]
        
        if request.path in health_paths:
            request.rate_limited = False
            # Skip logging for health checks to reduce noise
            request.skip_logging = True
        
        return self.get_response(request)
