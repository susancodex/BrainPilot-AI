import time
import threading
from dataclasses import dataclass, field
from enum import Enum
from typing import Literal


class ProviderName(str, Enum):
    GEMINI = "gemini"
    GROQ = "groq"
    OPENROUTER = "openrouter"


class CircuitState(str, Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker behavior."""
    failure_threshold: int = 3
    cooldown_seconds: float = 300.0
    half_open_max_calls: int = 2


class ProviderHealth:
    """Thread-safe health tracker with circuit breaker for a single AI provider."""

    def __init__(self, name: ProviderName, config: CircuitBreakerConfig | None = None):
        self.name = name
        self._config = config or CircuitBreakerConfig()
        self._lock = threading.Lock()
        self.consecutive_failures: int = 0
        self.last_failure_at: float = 0.0
        self.total_requests: int = 0
        self.total_successes: int = 0
        self.total_latency_ms: float = 0.0
        self._state: CircuitState = CircuitState.CLOSED
        self._half_open_calls: int = 0

    def record_success(self, latency_ms: float) -> None:
        with self._lock:
            self.consecutive_failures = 0
            self.total_requests += 1
            self.total_successes += 1
            self.total_latency_ms += latency_ms
            
            # Circuit breaker logic
            if self._state == CircuitState.HALF_OPEN:
                self._half_open_calls += 1
                if self._half_open_calls >= self._config.half_open_max_calls:
                    self._state = CircuitState.CLOSED
                    self._half_open_calls = 0
            elif self._state == CircuitState.OPEN:
                # Check if cooldown has passed
                elapsed = time.monotonic() - self.last_failure_at
                if elapsed >= self._config.cooldown_seconds:
                    self._state = CircuitState.HALF_OPEN
                    self._half_open_calls = 1

    def record_failure(self) -> None:
        with self._lock:
            self.consecutive_failures += 1
            self.last_failure_at = time.monotonic()
            self.total_requests += 1
            
            # Circuit breaker logic
            if self.consecutive_failures >= self._config.failure_threshold:
                self._state = CircuitState.OPEN
                self._half_open_calls = 0
            elif self._state == CircuitState.HALF_OPEN:
                self._state = CircuitState.OPEN
                self._half_open_calls = 0

    @property
    def is_healthy(self) -> bool:
        with self._lock:
            if self._state == CircuitState.OPEN:
                elapsed = time.monotonic() - self.last_failure_at
                if elapsed >= self._config.cooldown_seconds:
                    self._state = CircuitState.HALF_OPEN
                    return True
                return False
            return True

    @property
    def circuit_state(self) -> CircuitState:
        with self._lock:
            return self._state

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
            state = self._state.value

        is_healthy = self.is_healthy
        avg_lat = (total_latency_ms / total_successes) if total_successes > 0 else 0.0
        sr = (total_successes / total_requests) if total_requests > 0 else 1.0

        return {
            "provider": self.name.value,
            "healthy": is_healthy,
            "circuit_state": state,
            "consecutive_failures": consecutive_failures,
            "total_requests": total_requests,
            "success_rate": round(sr, 3),
            "avg_latency_ms": round(avg_lat, 1),
            "failure_threshold": self._config.failure_threshold,
            "cooldown_seconds": self._config.cooldown_seconds,
        }
