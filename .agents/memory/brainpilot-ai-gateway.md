---
name: BrainPilot AI Gateway
description: Multi-provider AI gateway in backend/ai/ — routing, failover, health monitoring, and known model/quota quirks.
---

# BrainPilot AI Gateway

## What it is
`backend/ai/` — a provider-agnostic gateway that routes AI calls through Gemini → Groq → OpenRouter automatically, with health monitoring and prompt security validation.

## Key files
- `backend/ai/gateway.py` — core routing + failover + prompt injection blocking
- `backend/ai/factory.py` — singleton `get_gateway()` / `reset_gateway()`
- `backend/ai/providers/gemini_provider.py` — primary
- `backend/ai/providers/groq_provider.py` — first fallback (Groq REST API, OpenAI-compatible)
- `backend/ai/providers/openrouter_provider.py` — final fallback; tries 5 models internally
- `backend/ai/types.py` — `ProviderHealth` (plain class, NOT dataclass; dataclass+threading.Lock deadlocked)
- `backend/services/ai_engine/adapters/gemini_adapter.py` — now a shim over the gateway; all existing callers unchanged
- `GET /api/v1/ai/health/` — live provider health endpoint (no auth required)

## Provider config
| Provider | Env var | Default model |
|---|---|---|
| Gemini | `GEMINI_API_KEY` | `gemini-2.5-flash` (NOT 2.0-flash — free tier quota is tiny) |
| Groq | `GROQ_API_KEY` | `llama-3.3-70b-versatile` |
| OpenRouter | `OPENROUTER_API_KEY` | 5-model fallback list (free tier; models rotate availability) |

**Why:** `gemini-2.0-flash` free tier quota is essentially 0 RPD in testing. `gemini-2.5-flash` has a usable free quota.

## OpenRouter free model reality
Free-tier models on OpenRouter are heavily rate-limited (429) and frequently unavailable (503). The provider tries 5 models in sequence. This is expected behaviour — the gateway catches it and raises `AllProvidersUnavailableError` gracefully. For production, upgrade to a paid OpenRouter plan or use a model slug without `:free`.

## Threading quirk
`ProviderHealth` must be a plain class (not a `@dataclass`) with `threading.Lock` in `__init__`. Using `field(default_factory=threading.Lock)` in a dataclass causes a deadlock on `as_dict()` in some Python 3.11 builds.

**Why:** The `dataclass` machinery evaluates `default_factory` at class-definition time in a way that interacts badly with the GIL under certain import conditions.

## Failover behaviour
- After 3 consecutive failures, a provider enters a 5-minute cooldown.
- Cooldown is per-process (in-memory); restarting Django resets it.
- `stream_chat` picks the first healthy provider and does not mid-stream failover (streams can't be retried transparently).

## Prompt security
Injection patterns blocked in `gateway.py`: "ignore all previous instructions", "reveal the system prompt", "you are now a ...", etc. Raises `PromptValidationError` (mapped to `AIServiceError` in the shim → HTTP 503).
