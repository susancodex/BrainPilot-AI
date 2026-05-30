import json
import logging
from typing import Any

import google.generativeai as genai
from django.conf import settings
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from common.exceptions import AIServiceError

logger = logging.getLogger(__name__)


class GeminiAdapter:
    def __init__(self):
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logger.warning("GEMINI_API_KEY not set — AI features will be disabled.")
        else:
            genai.configure(api_key=api_key)
        self.model_name = settings.GEMINI_MODEL
        self._model = None

    @property
    def model(self):
        if self._model is None:
            self._model = genai.GenerativeModel(self.model_name)
        return self._model

    @retry(
        stop=stop_after_attempt(settings.GEMINI_MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(Exception),
        reraise=True,
    )
    def generate_text(self, prompt: str) -> str:
        if not settings.GEMINI_API_KEY:
            raise AIServiceError("AI service is not configured. Please add GEMINI_API_KEY.")
        try:
            logger.debug("Gemini generate_text call, prompt length: %d", len(prompt))
            response = self.model.generate_content(prompt)
            result = response.text.strip()
            logger.debug("Gemini response received, length: %d", len(result))
            return result
        except Exception as exc:
            logger.error("Gemini generate_text failed: %s", exc)
            raise AIServiceError(f"AI generation failed: {exc}")

    @retry(
        stop=stop_after_attempt(settings.GEMINI_MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(Exception),
        reraise=True,
    )
    def generate_json(self, prompt: str) -> dict[str, Any]:
        if not settings.GEMINI_API_KEY:
            raise AIServiceError("AI service is not configured. Please add GEMINI_API_KEY.")
        try:
            logger.debug("Gemini generate_json call")
            response = self.model.generate_content(
                f"{prompt}\n\nRespond ONLY with valid JSON. No markdown, no code blocks.",
            )
            text = response.text.strip()
            if text.startswith("```"):
                lines = text.split("\n")
                text = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
            return json.loads(text)
        except json.JSONDecodeError as exc:
            logger.error("Gemini JSON parse failed: %s | Response: %s", exc, text[:500])
            raise AIServiceError("AI returned invalid JSON.")
        except Exception as exc:
            logger.error("Gemini generate_json failed: %s", exc)
            raise AIServiceError(f"AI generation failed: {exc}")

    def chat(self, system_prompt: str, messages: list[dict]) -> str:
        if not settings.GEMINI_API_KEY:
            raise AIServiceError("AI service is not configured. Please add GEMINI_API_KEY.")
        try:
            history = []
            for msg in messages[:-1]:
                role = "user" if msg["role"] == "user" else "model"
                history.append({"role": role, "parts": [msg["content"]]})

            chat_session = self.model.start_chat(history=history)
            last_message = messages[-1]["content"] if messages else ""
            full_prompt = f"{system_prompt}\n\n{last_message}" if not history else last_message
            response = chat_session.send_message(full_prompt)
            return response.text.strip()
        except Exception as exc:
            logger.error("Gemini chat failed: %s", exc)
            raise AIServiceError(f"Chat service failed: {exc}")
