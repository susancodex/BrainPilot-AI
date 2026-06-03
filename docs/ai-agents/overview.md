# AI Gateway & Agents

## Overview

BrainPilot routes all AI workloads through a centralised gateway that manages provider selection, health monitoring, and prompt security. Feature services never call a provider SDK directly.

## Multi-Provider Failover

```
Request → Gemini (primary)
             ↓ rate-limit / error
          Groq (fallback 1)
             ↓ rate-limit / error
          OpenRouter (fallback 2)
             ↓ all providers exhausted
          Graceful error → user-friendly message
```

After **3 consecutive failures**, a provider enters a **5-minute cooldown**. During cooldown, the gateway skips the provider entirely and routes to the next available one.

## Provider Configuration

| Provider | Model | Key Variable |
|----------|-------|-------------|
| Gemini | `gemini-2.5-flash` (configurable) | `GEMINI_API_KEY` |
| Groq | `llama-3.3-70b-versatile` | `GROQ_API_KEY` |
| OpenRouter | Multi-model rotation | `OPENROUTER_API_KEY` |

Providers are enabled automatically when their key is present. If no key is configured for a provider, it is silently skipped.

## Gateway Interface

```python
from ai.factory import get_gateway

gateway = get_gateway()

# Plain text generation
text = gateway.generate_text(prompt)

# Structured JSON generation
data = gateway.generate_json(prompt)

# Multi-turn chat
reply = gateway.chat(system_prompt, messages)

# Streaming chat (returns an iterator of text chunks)
for chunk in gateway.stream_chat(system_prompt, messages):
    yield chunk
```

## Prompt Security

Every prompt is validated before being sent to any provider:

- **Length check** — prompts exceeding 50,000 characters are rejected
- **Injection detection** — patterns like "ignore previous instructions", "you are now a...", "reveal your system prompt" are detected via regex and blocked with a `PromptValidationError`

## Health Monitoring

```http
GET /api/v1/ai/health/
```

Returns live status for each configured provider:

```json
[
  {
    "name": "gemini",
    "available": true,
    "healthy": true,
    "consecutive_failures": 0,
    "total_requests": 142,
    "success_rate": 0.99,
    "avg_latency_ms": 820.4
  },
  {
    "name": "groq",
    "available": true,
    "healthy": true,
    "consecutive_failures": 0,
    "total_requests": 3,
    "success_rate": 1.0,
    "avg_latency_ms": 310.2
  }
]
```

## AI Workflows

Higher-level workflows in `backend/services/ai_engine/workflows/` compose gateway calls into multi-step operations:

### Study Plan Workflow

1. Optionally extracts syllabus from uploaded PDF
2. Builds a prompt from subjects, target date, daily hours, and syllabus content
3. Calls `gateway.generate_json()` to produce a structured schedule
4. Service layer saves sessions to the database

### Quiz Workflow

1. Builds a prompt from subject, topic, question count, and difficulty
2. Calls `gateway.generate_json()` to produce questions and answer keys
3. Service layer saves quiz and questions to the database

### Feedback Workflow

1. After quiz submission, assembles answered questions with correct answers
2. Builds a coaching prompt
3. Calls `gateway.generate_text()` to produce personalised feedback
4. Feedback stored on the `QuizAttempt` record

## Conversation Memory

The chatbot maintains conversation history in the database. Before each AI call, `ConversationMemory` in `backend/services/ai_engine/memory/` loads the recent message history and injects it into the messages list, giving the model context across turns.

## Adding a New Provider

1. Create `backend/ai/providers/your_provider.py` implementing the `AIProvider` interface
2. Add the provider to the list in `backend/ai/factory.py` at the desired priority
3. Add the API key environment variable to `backend/.env.example`
4. Update `docs/ai-agents/overview.md`
