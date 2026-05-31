---
name: Gemini integration
description: How Gemini is wired into the Django backend
---

# Gemini Integration

- **SDK**: `google-genai` (NOT `google-generativeai` — that old package was removed)
- **Model**: `gemini-2.5-flash` (set in `GEMINI_MODEL` env var, default in `base.py`)
- **Key**: `GEMINI_API_KEY` Replit secret
- **Adapter**: `backend/services/ai_engine/adapters/gemini_adapter.py`
  - `generate_text(prompt)` — single-turn text
  - `generate_json(prompt)` — structured JSON output
  - `chat(system_prompt, messages)` — multi-turn with history
  - `stream_chat(system_prompt, messages)` — generator yielding text chunks

**Why:** All Gemini calls route through `GeminiAdapter` for consistent retry logic (tenacity, 3 attempts) and error wrapping to `AIServiceError`.

**How to apply:** Always import and instantiate `GeminiAdapter` — never call `google.genai` directly from app code.

## AI-powered endpoints
- `POST /api/v1/chatbot/send/` — full JSON chat response
- `POST /api/v1/chatbot/send/stream/` — SSE streaming (events: chunk/done/error)
- `POST /api/v1/quizzes/generate/` — quiz from topic or pasted notes
- `POST /api/v1/quizzes/<id>/submit/` — AI coaching feedback on attempt
- `POST /api/v1/planner/plans/generate/` — personalised study schedule
