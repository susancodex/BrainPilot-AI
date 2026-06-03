import json
import logging
import os
from typing import Iterator

import httpx

from ai.exceptions import (
    AuthenticationError,
    InvalidResponseError,
    ProviderError,
    RateLimitError,
    TimeoutError,
)
from ai.interfaces import AIProvider

logger = logging.getLogger(__name__)

PROVIDER_NAME = "openrouter"
BASE_URL = "https://openrouter.ai/api/v1"
TIMEOUT_SECONDS = 45

# Models tried in order; first one that succeeds wins.
DEFAULT_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "google/gemma-4-31b-it:free",
    "moonshotai/kimi-k2.6:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
]


class OpenRouterProvider(AIProvider):
    """OpenRouter provider — final fallback (OpenAI-compatible REST API)."""

    def __init__(self):
        self._api_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
        env_model = os.environ.get("OPENROUTER_MODEL", "").strip()
        self._models: list[str] = [env_model] if env_model else DEFAULT_MODELS
        self._headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": os.environ.get("SITE_URL", "https://brainpilot.ai"),
            "X-Title": "BrainPilot AI",
        }

    @property
    def name(self) -> str:
        return PROVIDER_NAME

    def is_available(self) -> bool:
        return bool(self._api_key)

    def generate_text(self, prompt: str) -> str:
        messages = [{"role": "user", "content": prompt}]
        return self._complete(messages)

    def generate_json(self, prompt: str) -> dict:
        messages = [
            {
                "role": "system",
                "content": (
                    "You must respond ONLY with valid JSON. "
                    "No explanation, no markdown, no code fences."
                ),
            },
            {"role": "user", "content": prompt},
        ]
        raw = self._complete(messages)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            start = raw.find("{")
            end = raw.rfind("}") + 1
            if start != -1 and end > start:
                try:
                    return json.loads(raw[start:end])
                except json.JSONDecodeError:
                    pass
            raise InvalidResponseError(PROVIDER_NAME, "Response was not valid JSON")

    def chat(self, system_prompt: str, messages: list[dict]) -> str:
        payload_messages = [{"role": "system", "content": system_prompt}] + [
            {"role": m["role"], "content": m["content"]} for m in messages
        ]
        return self._complete(payload_messages)

    def stream_chat(self, system_prompt: str, messages: list[dict]) -> Iterator[str]:
        payload_messages = [{"role": "system", "content": system_prompt}] + [
            {"role": m["role"], "content": m["content"]} for m in messages
        ]
        yield from self._stream(payload_messages)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _complete(self, messages: list[dict]) -> str:
        self._ensure_key()
        last_exc: Exception | None = None

        for model in self._models:
            payload = {"model": model, "messages": messages, "max_tokens": 8192}
            try:
                with httpx.Client(timeout=TIMEOUT_SECONDS) as client:
                    resp = client.post(
                        f"{BASE_URL}/chat/completions",
                        headers=self._headers,
                        json=payload,
                    )
                if resp.status_code == 200:
                    return self._extract_text(resp)
                exc = self._wrap_status(resp.status_code, resp.text)
                # Only retry on rate-limit / server errors; auth errors are fatal
                if isinstance(exc, AuthenticationError):
                    raise exc
                logger.warning(
                    "OpenRouter model %s failed (%s) — trying next model", model, exc
                )
                last_exc = exc

            except (AuthenticationError, InvalidResponseError):
                raise
            except httpx.TimeoutException as exc:
                logger.warning("OpenRouter model %s timed out — trying next model", model)
                last_exc = TimeoutError(PROVIDER_NAME, str(exc))
            except ProviderError:
                raise
            except Exception as exc:
                logger.warning(
                    "OpenRouter model %s unexpected error: %s — trying next model",
                    model,
                    exc,
                )
                last_exc = ProviderError(PROVIDER_NAME, str(exc))

        raise last_exc or ProviderError(PROVIDER_NAME, "All OpenRouter models exhausted")

    def _stream(self, messages: list[dict]) -> Iterator[str]:
        self._ensure_key()
        last_exc: Exception | None = None

        for model in self._models:
            payload = {
                "model": model,
                "messages": messages,
                "max_tokens": 8192,
                "stream": True,
            }
            try:
                with httpx.Client(timeout=TIMEOUT_SECONDS) as client:
                    with client.stream(
                        "POST",
                        f"{BASE_URL}/chat/completions",
                        headers=self._headers,
                        json=payload,
                    ) as resp:
                        if resp.status_code != 200:
                            body = resp.read().decode()
                            exc = self._wrap_status(resp.status_code, body)
                            if isinstance(exc, AuthenticationError):
                                raise exc
                            logger.warning(
                                "OpenRouter stream model %s failed (%s) — trying next",
                                model,
                                exc,
                            )
                            last_exc = exc
                            continue
                        for line in resp.iter_lines():
                            line = line.strip()
                            if not line or line == "data: [DONE]":
                                continue
                            if line.startswith("data: "):
                                line = line[6:]
                            try:
                                chunk = json.loads(line)
                                text = (
                                    chunk.get("choices", [{}])[0]
                                    .get("delta", {})
                                    .get("content", "")
                                )
                                if text:
                                    yield text
                            except (json.JSONDecodeError, IndexError):
                                continue
                        return  # streamed successfully

            except AuthenticationError:
                raise
            except httpx.TimeoutException as exc:
                logger.warning(
                    "OpenRouter stream model %s timed out — trying next", model
                )
                last_exc = TimeoutError(PROVIDER_NAME, str(exc))
            except ProviderError:
                raise
            except Exception as exc:
                logger.warning(
                    "OpenRouter stream model %s unexpected error: %s — trying next",
                    model,
                    exc,
                )
                last_exc = ProviderError(PROVIDER_NAME, str(exc))

        raise last_exc or ProviderError(PROVIDER_NAME, "All OpenRouter stream models exhausted")

    def _extract_text(self, resp: httpx.Response) -> str:
        try:
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError, json.JSONDecodeError) as exc:
            raise InvalidResponseError(
                PROVIDER_NAME, f"Unexpected response shape: {exc}"
            )

    def _wrap_status(self, status: int, body: str) -> ProviderError:
        if status in (401, 403):
            return AuthenticationError(PROVIDER_NAME, f"HTTP {status}")
        if status == 429:
            return RateLimitError(PROVIDER_NAME, f"HTTP 429: {body[:200]}")
        return ProviderError(PROVIDER_NAME, f"HTTP {status}: {body[:200]}")

    def _ensure_key(self) -> None:
        if not self._api_key:
            raise AuthenticationError(PROVIDER_NAME, "OPENROUTER_API_KEY not set")
