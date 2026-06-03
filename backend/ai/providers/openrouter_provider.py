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
DEFAULT_MODEL = "meta-llama/llama-3.1-8b-instruct:free"
TIMEOUT_SECONDS = 45


class OpenRouterProvider(AIProvider):
    """OpenRouter provider — final fallback (OpenAI-compatible REST API)."""

    def __init__(self):
        self._api_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
        self._model = os.environ.get("OPENROUTER_MODEL", DEFAULT_MODEL)
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
                "content": "You must respond ONLY with valid JSON. No explanation, no markdown, no code fences.",
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

    def _complete(self, messages: list[dict]) -> str:
        self._ensure_key()
        payload = {"model": self._model, "messages": messages, "max_tokens": 8192}
        try:
            with httpx.Client(timeout=TIMEOUT_SECONDS) as client:
                resp = client.post(
                    f"{BASE_URL}/chat/completions",
                    headers=self._headers,
                    json=payload,
                )
            return self._extract_text(resp)
        except httpx.TimeoutException as exc:
            raise TimeoutError(PROVIDER_NAME, str(exc))
        except ProviderError:
            raise
        except Exception as exc:
            raise ProviderError(PROVIDER_NAME, str(exc))

    def _stream(self, messages: list[dict]) -> Iterator[str]:
        self._ensure_key()
        payload = {
            "model": self._model,
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
                        raise self._wrap_status(resp.status_code, body)
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
        except ProviderError:
            raise
        except httpx.TimeoutException as exc:
            raise TimeoutError(PROVIDER_NAME, str(exc))
        except Exception as exc:
            raise ProviderError(PROVIDER_NAME, str(exc))

    def _extract_text(self, resp: httpx.Response) -> str:
        if resp.status_code != 200:
            raise self._wrap_status(resp.status_code, resp.text)
        try:
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError, json.JSONDecodeError) as exc:
            raise InvalidResponseError(PROVIDER_NAME, f"Unexpected response shape: {exc}")

    def _wrap_status(self, status: int, body: str) -> ProviderError:
        if status in (401, 403):
            return AuthenticationError(PROVIDER_NAME, f"HTTP {status}")
        if status == 429:
            return RateLimitError(PROVIDER_NAME, f"HTTP 429: {body[:200]}")
        return ProviderError(PROVIDER_NAME, f"HTTP {status}: {body[:200]}")

    def _ensure_key(self) -> None:
        if not self._api_key:
            raise AuthenticationError(PROVIDER_NAME, "OPENROUTER_API_KEY not set")
