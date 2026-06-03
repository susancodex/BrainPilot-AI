"""
High-level AI service functions.

These wrap the gateway and expose the same interface as the old GeminiAdapter,
making it easy to call from anywhere without worrying about provider routing.
"""

from typing import Iterator

from ai.factory import get_gateway


def generate_text(prompt: str) -> str:
    return get_gateway().generate_text(prompt)


def generate_json(prompt: str) -> dict:
    return get_gateway().generate_json(prompt)


def chat(system_prompt: str, messages: list[dict]) -> str:
    return get_gateway().chat(system_prompt, messages)


def stream_chat(system_prompt: str, messages: list[dict]) -> Iterator[str]:
    yield from get_gateway().stream_chat(system_prompt, messages)


def health_report() -> list[dict]:
    return get_gateway().health_report()
