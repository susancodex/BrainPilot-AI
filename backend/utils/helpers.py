import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Any


def generate_token(length: int = 32) -> str:
    return secrets.token_urlsafe(length)


def generate_verification_code(length: int = 6) -> str:
    return secrets.token_hex(length // 2).upper()[:length]


def hash_string(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def calculate_streak(dates: list[datetime]) -> int:
    if not dates:
        return 0
    sorted_dates = sorted(set(d.date() for d in dates), reverse=True)
    streak = 1
    for i in range(1, len(sorted_dates)):
        if (sorted_dates[i - 1] - sorted_dates[i]).days == 1:
            streak += 1
        else:
            break
    return streak


def minutes_to_hours_minutes(minutes: int) -> dict[str, int]:
    return {"hours": minutes // 60, "minutes": minutes % 60}


def safe_get(obj: Any, *keys: str, default=None) -> Any:
    for key in keys:
        try:
            obj = obj[key] if isinstance(obj, dict) else getattr(obj, key)
        except (KeyError, AttributeError, TypeError):
            return default
    return obj
