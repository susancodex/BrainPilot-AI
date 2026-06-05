"""
AI Gateway — multi-provider routing with automatic failover.

Priority: Gemini → Groq → OpenRouter
"""

import logging
import re
import time
from typing import Iterator

from ai.exceptions import (
    AllProvidersUnavailableError,
    ProviderError,
    PromptValidationError,
)
from ai.interfaces import AIProvider
from ai.types import ProviderHealth, ProviderName

logger = logging.getLogger(__name__)

MAX_PROMPT_LENGTH = 50_000
MIN_PROMPT_LENGTH = 1

_INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions?", re.I),
    re.compile(r"disregard\s+(all\s+)?(previous|prior)\s+instructions?", re.I),
    re.compile(r"you\s+are\s+now\s+(?:a\s+)?(?:an?\s+)?\w+\s*(?:ai|bot|assistant)?", re.I),
    re.compile(r"forget\s+everything\s+(you\s+know|before)", re.I),
    re.compile(r"reveal\s+(your|the)\s+(system\s+)?prompt", re.I),
]


class AIGateway:
    """
    Intelligent AI router with health monitoring and automatic failover.

    All methods mirror the GeminiAdapter interface so it can serve as a
    drop-in replacement. Callers never know which provider is active.
    """

    def __init__(self, providers: list[AIProvider]):
        self._providers = providers
        self._health: dict[str, ProviderHealth] = {
            p.name: ProviderHealth(name=ProviderName(p.name))
            for p in providers
        }

    def generate_text(self, prompt: str) -> str:
        self._validate_prompt(prompt)
        return self._execute("generate_text", prompt)

    def generate_json(self, prompt: str) -> dict:
        self._validate_prompt(prompt)
        return self._execute("generate_json", prompt)

    def chat(self, system_prompt: str, messages: list[dict]) -> str:
        self._validate_prompt(system_prompt or "")
        for m in messages:
            self._validate_prompt(m.get("content", ""))
        return self._execute("chat", system_prompt, messages)

    def stream_chat(self, system_prompt: str, messages: list[dict]) -> Iterator[str]:
        """
        Yields text chunks. Uses the first healthy provider and does NOT
        fall back mid-stream (streaming cannot be retried transparently).
        """
        self._validate_prompt(system_prompt or "")
        for m in messages:
            self._validate_prompt(m.get("content", ""))

        provider = self._pick_provider()
        if provider is None:
            raise AllProvidersUnavailableError(
                "No AI providers are currently available."
            )

        health = self._health[provider.name]
        start = time.monotonic()
        try:
            logger.info("stream_chat → provider=%s", provider.name)
            yield from provider.stream_chat(system_prompt, messages)
            health.record_success((time.monotonic() - start) * 1000)
        except Exception as exc:
            health.record_failure()
            logger.error(
                "stream_chat failed on provider=%s: %s", provider.name, exc
            )
            raise

    def health_report(self) -> list[dict]:
        report = []
        for provider in self._providers:
            entry = self._health[provider.name].as_dict()
            entry["configured"] = provider.is_available()
            report.append(entry)
        return report

    def _execute(self, method: str, *args):
        last_exc: Exception | None = None

        for provider in self._providers:
            if not provider.is_available():
                logger.debug("Skipping %s — not configured", provider.name)
                continue

            health = self._health[provider.name]
            if not health.is_healthy:
                logger.warning(
                    "Skipping %s — in cooldown (consecutive_failures=%d)",
                    provider.name,
                    health.consecutive_failures,
                )
                continue

            start = time.monotonic()
            try:
                logger.info("AI request → provider=%s method=%s", provider.name, method)
                result = getattr(provider, method)(*args)
                latency = (time.monotonic() - start) * 1000
                health.record_success(latency)
                logger.info(
                    "AI success  provider=%s method=%s latency=%.1fms",
                    provider.name,
                    method,
                    latency,
                )
                return result

            except ProviderError as exc:
                latency = (time.monotonic() - start) * 1000
                health.record_failure()
                logger.warning(
                    "Provider %s failed (method=%s latency=%.1fms): %s — trying next",
                    provider.name,
                    method,
                    latency,
                    exc,
                )
                last_exc = exc
                continue

            except Exception as exc:
                health.record_failure()
                logger.error(
                    "Unexpected error from provider=%s method=%s: %s — trying next",
                    provider.name,
                    method,
                    exc,
                )
                last_exc = exc
                continue

        logger.error(
            "All providers exhausted for method=%s. Last error: %s", method, last_exc
        )
        raise AllProvidersUnavailableError(
            "All AI providers are currently unavailable. Please try again later."
        )

    def _pick_provider(self) -> AIProvider | None:
        for provider in self._providers:
            if provider.is_available() and self._health[provider.name].is_healthy:
                return provider
        for provider in self._providers:
            if provider.is_available():
                return provider
        return None

    @staticmethod
    def _validate_prompt(prompt: str) -> None:
        if not isinstance(prompt, str):
            raise PromptValidationError("Prompt must be a string.")
        stripped = prompt.strip()
        if len(stripped) < MIN_PROMPT_LENGTH:
            return
        if len(stripped) > MAX_PROMPT_LENGTH:
            raise PromptValidationError(
                f"Prompt exceeds maximum allowed length ({MAX_PROMPT_LENGTH} chars)."
            )
        for pattern in _INJECTION_PATTERNS:
            if pattern.search(stripped):
                raise PromptValidationError(
                    "Prompt contains disallowed content and cannot be processed."
                )
