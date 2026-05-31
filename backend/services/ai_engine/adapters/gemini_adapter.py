import json
import logging
from typing import Any

from google import genai
from google.genai import types
from django.conf import settings
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from common.exceptions import AIServiceError

logger = logging.getLogger(__name__)


class GeminiAdapter:
    def __init__(self):
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logger.warning("GEMINI_API_KEY not set — AI features will be disabled.")
            self._client = None
        else:
            self._client = genai.Client(api_key=api_key)
        self.model_name = getattr(settings, "GEMINI_MODEL", "gemini-2.0-flash")

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
        full_prompt = f"{prompt}\n\nRespond ONLY with valid JSON. No markdown, no code blocks."
        try:
            logger.debug("Gemini generate_json call")
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=full_prompt,
            )
            text = response.text.strip()
            if text.startswith("```"):
                lines = text.split("\n")
                text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
            return json.loads(text)
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
