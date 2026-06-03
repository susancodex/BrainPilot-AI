import json
import logging
import os
from typing import Any

from google import genai
from google.genai import types
from django.conf import settings
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from common.exceptions import AIServiceError

logger = logging.getLogger(__name__)


class GeminiAdapter:
    def __init__(self):
        # Prefer Replit AI Integrations (no user key required) when env vars are present
        ai_key = os.environ.get("AI_INTEGRATIONS_GEMINI_API_KEY", "").strip()
        ai_base_url = os.environ.get("AI_INTEGRATIONS_GEMINI_BASE_URL", "").strip()

        if ai_key and ai_base_url:
            logger.info("Gemini: using Replit AI Integrations proxy")
            self._client = genai.Client(
                api_key=ai_key,
                http_options={"api_version": "", "base_url": ai_base_url},
            )
        else:
            # Fall back to user-supplied API key (strip whitespace to handle copy-paste issues)
            api_key = getattr(settings, "GEMINI_API_KEY", "").strip()
            if not api_key:
                logger.warning("GEMINI_API_KEY not set — AI features will be disabled.")
                self._client = None
            else:
                logger.info("Gemini: using direct API key")
                self._client = genai.Client(api_key=api_key)

        self.model_name = getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash")

    @property
    def client(self):
        if self._client is None:
            raise AIServiceError("AI service is not configured. Please add GEMINI_API_KEY.")
        return self._client

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(Exception),
        reraise=True,
    )
    def generate_text(self, prompt: str) -> str:
        try:
            logger.debug("Gemini generate_text call, prompt length: %d", len(prompt))
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )
            result = response.text.strip()
            logger.debug("Gemini response received, length: %d", len(result))
            return result
        except AIServiceError:
            raise
        except Exception as exc:
            logger.error("Gemini generate_text failed: %s", exc)
            raise AIServiceError(f"AI generation failed: {exc}")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(Exception),
        reraise=True,
    )
    def generate_json(self, prompt: str) -> dict[str, Any]:
        try:
            logger.debug("Gemini generate_json call")
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )
            return json.loads(response.text)
        except json.JSONDecodeError as exc:
            logger.error("Gemini JSON parse failed: %s", exc)
            raise AIServiceError("AI returned invalid JSON.")
        except AIServiceError:
            raise
        except Exception as exc:
            logger.error("Gemini generate_json failed: %s", exc)
            raise AIServiceError(f"AI generation failed: {exc}")

    def chat(self, system_prompt: str, messages: list[dict]) -> str:
        try:
            contents = []
            for msg in messages:
                role = "user" if msg["role"] == "user" else "model"
                contents.append(types.Content(role=role, parts=[types.Part(text=msg["content"])]))

            if not contents:
                contents = [types.Content(role="user", parts=[types.Part(text="Hello")])]

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    max_output_tokens=8192,
                ),
            )
            return response.text.strip()
        except AIServiceError:
            raise
        except Exception as exc:
            logger.error("Gemini chat failed: %s", exc)
            raise AIServiceError(f"Chat service failed: {exc}")

    def stream_chat(self, system_prompt: str, messages: list[dict]):
        """Yields text chunks from Gemini as a streaming generator."""
        try:
            contents = []
            for msg in messages:
                role = "user" if msg["role"] == "user" else "model"
                contents.append(types.Content(role=role, parts=[types.Part(text=msg["content"])]))

            if not contents:
                contents = [types.Content(role="user", parts=[types.Part(text="Hello")])]

            logger.debug("Gemini stream_chat call, %d messages", len(contents))
            for chunk in self.client.models.generate_content_stream(
                model=self.model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    max_output_tokens=8192,
                ),
            ):
                text = chunk.text
                if text:
                    yield text
        except AIServiceError:
            raise
        except Exception as exc:
            logger.error("Gemini stream_chat failed: %s", exc)
            raise AIServiceError(f"Chat streaming failed: {exc}")
