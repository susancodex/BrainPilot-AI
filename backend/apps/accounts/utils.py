from datetime import timedelta
from rest_framework_simplejwt.settings import api_settings


def set_jwt_cookies(response, access_token, refresh_token):
    """Set JWT tokens as HttpOnly cookies."""
    access_token_lifetime = api_settings.ACCESS_TOKEN_LIFETIME.total_seconds()
    refresh_token_lifetime = api_settings.REFRESH_TOKEN_LIFETIME.total_seconds()
    
    response.set_cookie(
        'access_token',
        access_token,
        max_age=int(access_token_lifetime),
        httponly=True,
        secure=True,
        samesite='Lax',
        path='/',
    )
    
    response.set_cookie(
        'refresh_token',
        refresh_token,
        max_age=int(refresh_token_lifetime),
        httponly=True,
        secure=True,
        samesite='Lax',
        path='/',
    )
    
    return response


def delete_jwt_cookies(response):
    """Delete JWT cookies."""
    response.delete_cookie('access_token', path='/')
    response.delete_cookie('refresh_token', path='/')
    return response
