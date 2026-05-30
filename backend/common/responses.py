from rest_framework.response import Response
from rest_framework import status


def success_response(data=None, message="Request successful", status_code=status.HTTP_200_OK):
    payload = {"success": True, "message": message}
    if data is not None:
        payload["data"] = data
    return Response(payload, status=status_code)


def created_response(data=None, message="Created successfully"):
    return success_response(data=data, message=message, status_code=status.HTTP_201_CREATED)


def error_response(message="An error occurred", errors=None, status_code=status.HTTP_400_BAD_REQUEST):
    payload = {"success": False, "message": message}
    if errors is not None:
        payload["errors"] = errors
    return Response(payload, status=status_code)


def not_found_response(message="Resource not found"):
    return error_response(message=message, status_code=status.HTTP_404_NOT_FOUND)


def forbidden_response(message="Permission denied"):
    return error_response(message=message, status_code=status.HTTP_403_FORBIDDEN)


def unauthorized_response(message="Authentication required"):
    return error_response(message=message, status_code=status.HTTP_401_UNAUTHORIZED)
