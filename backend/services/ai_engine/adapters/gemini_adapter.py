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

    def __init__(self):
        from ai.factory import get_gateway

        self._gateway = get_gateway()

    def generate_text(self, prompt: str) -> str:
        from common.exceptions import AIServiceError
        from ai.exceptions import GatewayError, PromptValidationError

        try:
            return self._gateway.generate_text(prompt)
        except PromptValidationError as exc:
            raise AIServiceError(str(exc))
        except GatewayError as exc:
            logger.error("AI Gateway generate_text failed: %s", exc)
            raise AIServiceError("AI service is temporarily unavailable. Please try again.")
        except Exception as exc:
            logger.error("Unexpected AI error in generate_text: %s", exc)
            raise AIServiceError("AI service error. Please try again.")

    def generate_json(self, prompt: str) -> dict[str, Any]:
        from common.exceptions import AIServiceError
        from ai.exceptions import GatewayError, PromptValidationError

        try:
            return self._gateway.generate_json(prompt)
        except PromptValidationError as exc:
            raise AIServiceError(str(exc))
        except GatewayError as exc:
            logger.error("AI Gateway generate_json failed: %s", exc)
            raise AIServiceError("AI service is temporarily unavailable. Please try again.")
        except Exception as exc:
            logger.error("Unexpected AI error in generate_json: %s", exc)
            raise AIServiceError("AI service error. Please try again.")

    def chat(self, system_prompt: str, messages: list[dict]) -> str:
        from common.exceptions import AIServiceError
        from ai.exceptions import GatewayError, PromptValidationError

        try:
            return self._gateway.chat(system_prompt, messages)
        except PromptValidationError as exc:
            raise AIServiceError(str(exc))
        except GatewayError as exc:
            logger.error("AI Gateway chat failed: %s", exc)
            raise AIServiceError("AI service is temporarily unavailable. Please try again.")
        except Exception as exc:
            logger.error("Unexpected AI error in chat: %s", exc)
            raise AIServiceError("AI service error. Please try again.")

    def stream_chat(self, system_prompt: str, messages: list[dict]) -> Iterator[str]:
        """
        Yields text chunks. Exceptions propagate to the view layer which
        converts them to SSE error events.
        """
        from common.exceptions import AIServiceError
        from ai.exceptions import GatewayError, PromptValidationError

        try:
            yield from self._gateway.stream_chat(system_prompt, messages)
        except PromptValidationError as exc:
            raise AIServiceError(str(exc))
        except GatewayError as exc:
            logger.error("AI Gateway stream_chat failed: %s", exc)
            raise AIServiceError("AI service is temporarily unavailable. Please try again.")
        except Exception as exc:
            logger.error("Unexpected AI error in stream_chat: %s", exc)
            raise AIServiceError("AI service error. Please try again.")

    @property
    def model_name(self) -> str:
        import os
        return os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")

    @property
    def client(self):
        """Legacy property — returns gateway for compat; prefer gateway methods."""
        return self._gateway
