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
            if "detail" in errors:
                message = str(errors.pop("detail"))
            elif "non_field_errors" in errors:
                message = str(errors.pop("non_field_errors")[0])

        payload = {"success": False, "message": message}
        if errors and errors != {}:
            payload["errors"] = errors

        response.data = payload
        return response

    logger.exception("Unhandled exception in API", exc_info=exc)
    return Response(
        {"success": False, "message": "Internal server error"},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
