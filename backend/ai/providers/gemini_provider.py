import json
import logging
import os
from typing import Iterator

from ai.exceptions import (
    AuthenticationError,
    InvalidResponseError,
    ProviderError,
    RateLimitError,
    TimeoutError,
)
from ai.interfaces import AIProvider

logger = logging.getLogger(__name__)

PROVIDER_NAME = "gemini"


class GeminiProvider(AIProvider):
    """Google Gemini provider — primary."""

    def __init__(self):
        self._client = None
        self._model = self._resolve_model()
        self._init_client()

    @staticmethod
    def _resolve_model() -> str:
        try:
            from django.conf import settings

            return getattr(settings, "GEMINI_MODEL", None) or os.environ.get(
                "GEMINI_MODEL", "gemini-2.5-flash"
            )
        except Exception:
            return os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

    def _init_client(self) -> None:
        try:
            from google import genai

            ai_key = os.environ.get("AI_INTEGRATIONS_GEMINI_API_KEY", "").strip()
            ai_base_url = os.environ.get("AI_INTEGRATIONS_GEMINI_BASE_URL", "").strip()

            if ai_key and ai_base_url:
                self._client = genai.Client(
                    api_key=ai_key,
                    http_options={"api_version": "", "base_url": ai_base_url},
                )
                logger.info("Gemini provider: using provider proxy")
                return

            direct_key = os.environ.get("GEMINI_API_KEY", "").strip()
            if not direct_key:
                try:
                    from django.conf import settings

                    direct_key = (getattr(settings, "GEMINI_API_KEY", None) or "").strip()
                except Exception:
                    pass
            if direct_key:
                self._client = genai.Client(api_key=direct_key)
                logger.info("Gemini provider: using direct API key")
                return

            logger.warning("Gemini provider: no API key configured")
        except ImportError:
            logger.error("Gemini provider: google-genai package not installed")

    @property
    def name(self) -> str:
        return PROVIDER_NAME

    def is_available(self) -> bool:
        return self._client is not None

    def generate_text(self, prompt: str) -> str:
        self._ensure_client()
        try:
            response = self._client.models.generate_content(
                model=self._model,
                contents=prompt,
            )
            return response.text.strip()
        except Exception as exc:
            raise self._wrap(exc)

    def generate_json(self, prompt: str) -> dict:
        self._ensure_client()
        try:
            from google.genai import types

            response = self._client.models.generate_content(
                model=self._model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )
            return json.loads(response.text)
        except json.JSONDecodeError as exc:
            raise InvalidResponseError(PROVIDER_NAME, f"JSON parse error: {exc}")
        except ProviderError:
            raise
        except Exception as exc:
            raise self._wrap(exc)

    def chat(self, system_prompt: str, messages: list[dict]) -> str:
        self._ensure_client()
        try:
            from google.genai import types

            contents = self._build_contents(messages)
            response = self._client.models.generate_content(
                model=self._model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    max_output_tokens=8192,
                ),
            )
            return response.text.strip()
        except ProviderError:
            raise
        except Exception as exc:
            raise self._wrap(exc)

    def stream_chat(self, system_prompt: str, messages: list[dict]) -> Iterator[str]:
        self._ensure_client()
        try:
            from google.genai import types

            contents = self._build_contents(messages)
            for chunk in self._client.models.generate_content_stream(
                model=self._model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    max_output_tokens=8192,
                ),
            ):
                if chunk.text:
                    yield chunk.text
        except ProviderError:
            raise
        except Exception as exc:
            raise self._wrap(exc)

    def _ensure_client(self) -> None:
        if self._client is None:
            raise AuthenticationError(PROVIDER_NAME, "No API key configured")

    def _build_contents(self, messages: list[dict]):
        from google.genai import types

        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append(
                types.Content(role=role, parts=[types.Part(text=msg["content"])])
            )
        if not contents:
            contents = [
                types.Content(role="user", parts=[types.Part(text="Hello")])
            ]
        return contents

    def _wrap(self, exc: Exception) -> ProviderError:
        msg = str(exc).lower()
        if "429" in msg or "rate" in msg or "quota" in msg or "resource_exhausted" in msg:
            return RateLimitError(PROVIDER_NAME, str(exc))
        if "401" in msg or "403" in msg or "api_key" in msg or "auth" in msg:
            return AuthenticationError(PROVIDER_NAME, str(exc))
        if "timeout" in msg or "deadline" in msg:
            return TimeoutError(PROVIDER_NAME, str(exc))
        return ProviderError(PROVIDER_NAME, str(exc))
