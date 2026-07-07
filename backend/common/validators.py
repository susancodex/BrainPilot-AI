"""
Input validation utilities for common data types.

Provides reusable validators for passwords, dates, numbers, and text content.
"""

import re
from typing import Any
from django.core.exceptions import ValidationError
from django.utils import timezone


def validate_strong_password(value: str) -> None:
    """
    Validate that a password meets security requirements.
    
    Requirements:
    - At least 8 characters long
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    - Contains at least one digit
    
    Args:
        value: The password to validate
        
    Raises:
        ValidationError: If password doesn't meet requirements
    """
    if len(value) < 8:
        raise ValidationError("Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", value):
        raise ValidationError("Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", value):
        raise ValidationError("Password must contain at least one lowercase letter.")
    if not re.search(r"\d", value):
        raise ValidationError("Password must contain at least one digit.")


def validate_future_date(value: Any) -> None:
    """
    Validate that a date is in the future.
    
    Args:
        value: The date to validate
        
    Raises:
        ValidationError: If date is not in the future
    """
    if value < timezone.now().date():
        raise ValidationError("Date must be in the future.")


def validate_positive_integer(value: int) -> None:
    """
    Validate that a value is a positive integer.
    
    Args:
        value: The integer to validate
        
    Raises:
        ValidationError: If value is not positive
    """
    if value <= 0:
        raise ValidationError("Value must be a positive integer.")


def validate_url_safe(value: str) -> None:
    """
    Validate that a string is URL-safe (no special characters that could cause issues).
    
    Args:
        value: The string to validate
        
    Raises:
        ValidationError: If string contains unsafe characters
    """
    if not re.match(r'^[a-zA-Z0-9\-_]+$', value):
        raise ValidationError("Value must contain only alphanumeric characters, hyphens, and underscores.")


def validate_email_format(value: str) -> None:
    """
    Validate email format with stricter rules than Django's default.
    
    Args:
        value: The email address to validate
        
    Raises:
        ValidationError: If email format is invalid
    """
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, value):
        raise ValidationError("Please enter a valid email address.")


def validate_text_length(value: str, min_length: int = 1, max_length: int = 10000) -> None:
    """
    Validate text length within specified bounds.
    
    Args:
        value: The text to validate
        min_length: Minimum allowed length (default: 1)
        max_length: Maximum allowed length (default: 10000)
        
    Raises:
        ValidationError: If text is outside length bounds
    """
    if len(value) < min_length:
        raise ValidationError(f"Text must be at least {min_length} characters long.")
    if len(value) > max_length:
        raise ValidationError(f"Text must not exceed {max_length} characters.")


def validate_no_html_tags(value: str) -> None:
    """
    Validate that text doesn't contain HTML tags (security measure).
    
    Args:
        value: The text to validate
        
    Raises:
        ValidationError: If HTML tags are detected
    """
    if re.search(r'<[^>]+>', value):
        raise ValidationError("HTML tags are not allowed in this field.")


def validate_json_string(value: str) -> None:
    """
    Validate that a string is valid JSON.
    
    Args:
        value: The JSON string to validate
        
    Raises:
        ValidationError: If string is not valid JSON
    """
    import json
    try:
        json.loads(value)
    except json.JSONDecodeError:
        raise ValidationError("Invalid JSON format.")


def validate_hex_color(value: str) -> None:
    """
    Validate that a string is a valid hex color code.
    
    Args:
        value: The color code to validate (e.g., "#FF5733" or "FF5733")
        
    Raises:
        ValidationError: If not a valid hex color
    """
    hex_pattern = r'^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'
    if not re.match(hex_pattern, value):
        raise ValidationError("Please enter a valid hex color code (e.g., #FF5733).")
