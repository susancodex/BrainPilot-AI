import time
import threading
from dataclasses import dataclass, field
from enum import Enum


class ProviderName(str, Enum):
    GEMINI = "gemini"
    GROQ = "groq"
    OPENROUTER = "openrouter"


class ProviderHealth:
    """Thread-safe health tracker for a single AI provider."""

    FAILURE_THRESHOLD: int = 3
    COOLDOWN_SECONDS: float = 300.0

    def __init__(self, name: ProviderName):
        self.name = name
        self._lock = threading.Lock()
        self.consecutive_failures: int = 0
        self.last_failure_at: float = 0.0
        self.total_requests: int = 0
        self.total_successes: int = 0
        self.total_latency_ms: float = 0.0

    def record_success(self, latency_ms: float) -> None:
        with self._lock:
            self.consecutive_failures = 0
            self.total_requests += 1
            self.total_successes += 1
            self.total_latency_ms += latency_ms

    def record_failure(self) -> None:
        with self._lock:
            self.consecutive_failures += 1
            self.last_failure_at = time.monotonic()
            self.total_requests += 1

    @property
    def is_healthy(self) -> bool:
        with self._lock:
            if self.consecutive_failures >= self.FAILURE_THRESHOLD:
                elapsed = time.monotonic() - self.last_failure_at
                return elapsed >= self.COOLDOWN_SECONDS
            return True

    @property
    def success_rate(self) -> float:
        with self._lock:
            if self.total_requests == 0:
                return 1.0
            return self.total_successes / self.total_requests

    @property
    def avg_latency_ms(self) -> float:
        with self._lock:
            if self.total_successes == 0:
                return 0.0
            return self.total_latency_ms / self.total_successes

    def as_dict(self) -> dict:
        with self._lock:
            consecutive_failures = self.consecutive_failures
            total_requests = self.total_requests
            total_successes = self.total_successes
            total_latency_ms = self.total_latency_ms
            last_failure_at = self.last_failure_at

        is_healthy = True
        if consecutive_failures >= self.FAILURE_THRESHOLD:
            elapsed = time.monotonic() - last_failure_at
            is_healthy = elapsed >= self.COOLDOWN_SECONDS

        avg_lat = (total_latency_ms / total_successes) if total_successes > 0 else 0.0
        sr = (total_successes / total_requests) if total_requests > 0 else 1.0

        return {
            "provider": self.name.value,
            "healthy": is_healthy,
            "consecutive_failures": consecutive_failures,
            "total_requests": total_requests,
            "success_rate": round(sr, 3),
            "avg_latency_ms": round(avg_lat, 1),
        }
