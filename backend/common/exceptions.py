import logging
from rest_framework.views import exception_handler
from rest_framework import status
from rest_framework.response import Response
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404

logger = logging.getLogger(__name__)


class AppError(Exception):
    def __init__(self, message="An error occurred", status_code=status.HTTP_400_BAD_REQUEST, errors=None):
        self.message = message
        self.status_code = status_code
        self.errors = errors
        super().__init__(message)


class NotFoundError(AppError):
    def __init__(self, message="Resource not found"):
        super().__init__(message=message, status_code=status.HTTP_404_NOT_FOUND)


class ForbiddenError(AppError):
    def __init__(self, message="Permission denied"):
        super().__init__(message=message, status_code=status.HTTP_403_FORBIDDEN)


class AIServiceError(AppError):
    def __init__(self, message="AI service unavailable"):
        super().__init__(message=message, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)


class ConflictError(AppError):
    def __init__(self, message="Resource conflict"):
        super().__init__(message=message, status_code=status.HTTP_409_CONFLICT)


def _normalize_api_message(message: str) -> str:
    lower = message.lower()
    if "already exists" in lower or "already registered" in lower:
        if "email" in lower or "account" in lower or "user with this" in lower:
            return "This account is already registered."
    return message


def _first_validation_message(errors) -> str | None:
    """Pick a human-readable message from DRF validation error payloads."""
    if not isinstance(errors, dict):
        return None
    for key in ("non_field_errors", "detail", "email", "password", "password_confirm"):
        if key not in errors:
            continue
        value = errors[key]
        if isinstance(value, list) and value:
            return str(value[0])
        if isinstance(value, str):
            return value
    for value in errors.values():
        if isinstance(value, list) and value:
            return str(value[0])
        if isinstance(value, str):
            return value
    return None


def custom_exception_handler(exc, context):
    if isinstance(exc, AppError):
        payload = {"success": False, "message": exc.message}
        if exc.errors:
            payload["errors"] = exc.errors
        return Response(payload, status=exc.status_code)

    if isinstance(exc, Http404):
        return Response(
            {"success": False, "message": "Resource not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if isinstance(exc, DjangoValidationError):
        return Response(
            {"success": False, "message": "Validation error", "errors": exc.message_dict if hasattr(exc, "message_dict") else {"detail": exc.messages}},
            status=status.HTTP_400_BAD_REQUEST,
        )

    response = exception_handler(exc, context)

    if response is not None:
        errors = response.data
        message = "An error occurred"

        if isinstance(errors, dict):
            extracted = _first_validation_message(errors)
            if extracted:
                message = extracted
            elif "detail" in errors:
                message = str(errors.get("detail"))
            elif "non_field_errors" in errors:
                nf = errors.get("non_field_errors")
                if isinstance(nf, list) and nf:
                    message = str(nf[0])

        message = _normalize_api_message(message)

        payload = {"success": False, "message": message}
        if isinstance(errors, dict) and errors:
            payload["errors"] = errors

        response.data = payload
        return response

    logger.exception("Unhandled exception in API", exc_info=exc)
    return Response(
        {"success": False, "message": "Internal server error"},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
