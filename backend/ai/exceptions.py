class GatewayError(Exception):
    """Base exception for all AI gateway errors."""
    
    def __init__(self, message: str, details: dict | None = None):
        self.message = message
        self.details = details or {}
        super().__init__(message)


class AllProvidersUnavailableError(GatewayError):
    """Raised when every provider in the chain has failed."""
    
    def __init__(self, message: str = "All AI providers are currently unavailable. Please try again later.", details: dict | None = None):
        super().__init__(message, details)


class ProviderError(GatewayError):
    """Raised when a single provider call fails."""

    def __init__(self, provider: str, reason: str, status_code: int | None = None, details: dict | None = None):
        self.provider = provider
        self.reason = reason
        self.status_code = status_code
        super().__init__(f"[{provider}] {reason}", details)


class RateLimitError(ProviderError):
    """Provider returned a rate-limit or quota response."""
    
    def __init__(self, provider: str, reason: str = "Rate limit exceeded", retry_after: int | None = None):
        self.retry_after = retry_after
        details = {"retry_after": retry_after} if retry_after else None
        super().__init__(provider, reason, status_code=429, details=details)


class AuthenticationError(ProviderError):
    """Provider rejected the API key."""
    
    def __init__(self, provider: str, reason: str = "Authentication failed"):
        super().__init__(provider, reason, status_code=401)


class TimeoutError(ProviderError):
    """Provider did not respond within the deadline."""
    
    def __init__(self, provider: str, reason: str = "Request timeout"):
        super().__init__(provider, reason, status_code=504)


class InvalidResponseError(ProviderError):
    """Provider returned a response that could not be parsed."""
    
    def __init__(self, provider: str, reason: str = "Invalid response format"):
        super().__init__(provider, reason, status_code=502)


class PromptValidationError(GatewayError):
    """Prompt failed security / sanity checks before being sent."""
    
    def __init__(self, reason: str, validation_type: str = "general"):
        details = {"validation_type": validation_type}
        super().__init__(reason, details)
