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

PROVIDER_NAME = "huggingface"
BASE_URL = "https://api-inference.huggingface.co/v1"
TIMEOUT_SECONDS = 60

# Models tried in order. HF free tier allows many models.
DEFAULT_MODELS = [
    "meta-llama/Llama-3.1-8B-Instruct",
    "mistralai/Mistral-7B-Instruct-v0.3",
    "HuggingFaceH4/zephyr-7b-beta",
    "google/gemma-2-9b-it",
    "microsoft/Phi-3.5-mini-instruct",
]


class HuggingFaceProvider(AIProvider):
    """Hugging Face Inference API provider (OpenAI-compatible /v1 endpoint)."""

    def __init__(self):
        self._api_key = os.environ.get("HUGGINGFACE_API_KEY", "").strip()
        env_model = os.environ.get("HUGGINGFACE_MODEL", "").strip()
        self._models: list[str] = [env_model] if env_model else DEFAULT_MODELS
        self._headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

    @property
    def name(self) -> str:
        return PROVIDER_NAME

    def is_available(self) -> bool:
        return bool(self._api_key)

    def generate_text(self, prompt: str) -> str:
        return self._complete([{"role": "user", "content": prompt}])

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
            start, end = raw.find("{"), raw.rfind("}") + 1
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

    def _complete(self, messages: list[dict]) -> str:
        self._ensure_key()
        last_exc: Exception | None = None

        for model in self._models:
            payload = {
                "model": model,
                "messages": messages,
                "max_tokens": 8192,
                "temperature": 0.7,
            }
            try:
                with httpx.Client(timeout=TIMEOUT_SECONDS) as client:
                    resp = client.post(
                        f"{BASE_URL}/chat/completions",
                        headers=self._headers,
                        json=payload,
                    )
                if resp.status_code == 200:
                    return self._extract(resp)
                exc = self._wrap_status(resp.status_code, resp.text)
                if isinstance(exc, AuthenticationError):
                    raise exc
                logger.warning(
                    "HuggingFace model %s failed (%s) — trying next", model, exc
                )
                last_exc = exc
            except (AuthenticationError, InvalidResponseError):
                raise
            except httpx.TimeoutException as exc:
                logger.warning("HuggingFace model %s timed out — trying next", model)
                last_exc = TimeoutError(PROVIDER_NAME, str(exc))
            except ProviderError:
                raise
            except Exception as exc:
                logger.warning(
                    "HuggingFace model %s unexpected error: %s — trying next",
                    model, exc,
                )
                last_exc = ProviderError(PROVIDER_NAME, str(exc))

        raise last_exc or ProviderError(
            PROVIDER_NAME, "All HuggingFace models exhausted"
        )

    def _stream(self, messages: list[dict]) -> Iterator[str]:
        self._ensure_key()
        last_exc: Exception | None = None

        for model in self._models:
            payload = {
                "model": model,
                "messages": messages,
                "max_tokens": 8192,
                "temperature": 0.7,
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
                                "HuggingFace stream model %s failed — trying next",
                                model,
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
                        return
            except AuthenticationError:
                raise
            except httpx.TimeoutException as exc:
                logger.warning(
                    "HuggingFace stream model %s timed out — trying next", model
                )
                last_exc = TimeoutError(PROVIDER_NAME, str(exc))
            except ProviderError:
                raise
            except Exception as exc:
                logger.warning(
                    "HuggingFace stream model %s unexpected error: %s — trying next",
                    model, exc,
                )
                last_exc = ProviderError(PROVIDER_NAME, str(exc))

        raise last_exc or ProviderError(
            PROVIDER_NAME, "All HuggingFace stream models exhausted"
        )

    def _extract(self, resp: httpx.Response) -> str:
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
            raise AuthenticationError(PROVIDER_NAME, "HUGGINGFACE_API_KEY not set")
