"""
GeminiAdapter — thin compatibility shim over the AI Gateway.

All existing callers (services, workflows, tasks) continue to work unchanged.
The gateway handles provider routing: Gemini → Groq → OpenRouter.
"""

import logging
from typing import Any, Iterator

logger = logging.getLogger(__name__)


class GeminiAdapter:
    """
    Drop-in replacement for the original GeminiAdapter.
    Delegates every call to the multi-provider AIGateway.
    """

    def __init__(self, user=None):
        from ai.factory import get_gateway

        self._user = user
        self._gateway = get_gateway()

    def _consume_ai_quota(self) -> None:
        if self._user is None:
            return
        from apps.subscriptions.services import SubscriptionService

        SubscriptionService.assert_ai_allowed(self._user)

    def _record_ai_usage(self) -> None:
        if self._user is None:
            return
        from apps.subscriptions.services import SubscriptionService

        SubscriptionService.increment_ai_usage(self._user)

    @staticmethod
    def _raise_ai_error(exc: Exception, method: str) -> None:
        from common.exceptions import AIServiceError
        from ai.exceptions import (
            AllProvidersUnavailableError,
            GatewayError,
            PromptValidationError,
        )

        if isinstance(exc, PromptValidationError):
            raise AIServiceError(str(exc)) from exc
        if isinstance(exc, AllProvidersUnavailableError):
            raise AIServiceError(
                "AI is not configured. Add GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY."
            ) from exc
        if isinstance(exc, GatewayError):
            logger.error("AI Gateway %s failed: %s", method, exc)
            raise AIServiceError(
                "AI service is temporarily unavailable. Please try again."
            ) from exc
        logger.error("Unexpected AI error in %s: %s", method, exc)
        raise AIServiceError("AI service error. Please try again.") from exc

    def generate_text(self, prompt: str) -> str:
        self._consume_ai_quota()
        try:
            result = self._gateway.generate_text(prompt)
            self._record_ai_usage()
            return result
        except Exception as exc:
            self._raise_ai_error(exc, "generate_text")

    def generate_json(self, prompt: str) -> dict[str, Any]:
        self._consume_ai_quota()
        try:
            result = self._gateway.generate_json(prompt)
            self._record_ai_usage()
            return result
        except Exception as exc:
            self._raise_ai_error(exc, "generate_json")

    def chat(self, system_prompt: str, messages: list[dict]) -> str:
        self._consume_ai_quota()
        try:
            result = self._gateway.chat(system_prompt, messages)
            self._record_ai_usage()
            return result
        except Exception as exc:
            self._raise_ai_error(exc, "chat")

    def stream_chat(self, system_prompt: str, messages: list[dict]) -> Iterator[str]:
        """
        Yields text chunks. Caller must call record_stream_usage() after a successful stream.
        """
        self._consume_ai_quota()
        try:
            yield from self._gateway.stream_chat(system_prompt, messages)
        except Exception as exc:
            self._raise_ai_error(exc, "stream_chat")

    def record_stream_usage(self) -> None:
        """Call once after a streaming response completes successfully."""
        self._record_ai_usage()

    @property
    def model_name(self) -> str:
        import os

        return os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

    @property
    def client(self):
        """Legacy property — returns gateway for compat; prefer gateway methods."""
        return self._gateway
