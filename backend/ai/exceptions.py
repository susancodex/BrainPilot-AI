class GatewayError(Exception):
    """Base exception for all AI gateway errors."""


class AllProvidersUnavailableError(GatewayError):
    """Raised when every provider in the chain has failed."""


class ProviderError(GatewayError):
    """Raised when a single provider call fails."""

    def __init__(self, provider: str, reason: str):
        self.provider = provider
        self.reason = reason
        super().__init__(f"[{provider}] {reason}")


class RateLimitError(ProviderError):
    """Provider returned a rate-limit or quota response."""


class AuthenticationError(ProviderError):
    """Provider rejected the API key."""


class TimeoutError(ProviderError):
    """Provider did not respond within the deadline."""


class InvalidResponseError(ProviderError):
    """Provider returned a response that could not be parsed."""


class PromptValidationError(GatewayError):
    """Prompt failed security / sanity checks before being sent."""
