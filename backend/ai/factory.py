"""
Singleton factory — returns the single shared AIGateway instance.

Import and call get_gateway() wherever you need AI access.
"""

import logging
import threading

from ai.gateway import AIGateway
from ai.providers.gemini_provider import GeminiProvider
from ai.providers.groq_provider import GroqProvider
from ai.providers.openrouter_provider import OpenRouterProvider

logger = logging.getLogger(__name__)

_lock = threading.Lock()
_gateway: AIGateway | None = None


def get_gateway() -> AIGateway:
    """
    Return the shared AIGateway instance (created once, thread-safe).

    Provider order: Gemini (primary) → Groq → OpenRouter
    """
    global _gateway
    if _gateway is None:
        with _lock:
            if _gateway is None:
                providers = [
                    GeminiProvider(),
                    GroqProvider(),
                    OpenRouterProvider(),
                ]
                available = [p.name for p in providers if p.is_available()]
                unavailable = [p.name for p in providers if not p.is_available()]

                if available:
                    logger.info(
                        "AI Gateway initialised — available: %s | unconfigured: %s",
                        available,
                        unavailable,
                    )
                else:
                    logger.warning(
                        "AI Gateway: NO providers are configured. "
                        "Set GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY."
                    )

                _gateway = AIGateway(providers)

    return _gateway


def reset_gateway() -> None:
    """Force re-initialisation on next call (useful in tests)."""
    global _gateway
    with _lock:
        _gateway = None
