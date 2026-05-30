import re
from django.core.exceptions import ValidationError


def validate_strong_password(value):
    if len(value) < 8:
        raise ValidationError("Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", value):
        raise ValidationError("Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", value):
        raise ValidationError("Password must contain at least one lowercase letter.")
    if not re.search(r"\d", value):
        raise ValidationError("Password must contain at least one digit.")


def validate_future_date(value):
    from django.utils import timezone
    if value < timezone.now().date():
        raise ValidationError("Date must be in the future.")


def validate_positive_integer(value):
    if value <= 0:
        raise ValidationError("Value must be a positive integer.")
