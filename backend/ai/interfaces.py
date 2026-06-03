from abc import ABC, abstractmethod
from typing import Iterator


class AIProvider(ABC):
    """Abstract contract that every provider must implement."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable provider name."""

    @abstractmethod
    def is_available(self) -> bool:
        """Return True if the provider has a valid API key configured."""

    @abstractmethod
    def generate_text(self, prompt: str) -> str:
        """Generate a plain-text response for a single prompt."""

    @abstractmethod
    def generate_json(self, prompt: str) -> dict:
        """Generate a structured JSON response for a single prompt."""

    @abstractmethod
    def chat(self, system_prompt: str, messages: list[dict]) -> str:
        """Single-turn or multi-turn chat; returns the full assistant reply."""

    @abstractmethod
    def stream_chat(self, system_prompt: str, messages: list[dict]) -> Iterator[str]:
        """Streaming chat; yields text chunks as they arrive."""
