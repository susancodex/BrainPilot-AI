---
name: BrainPilot production fixes
description: Durable decisions made during the production-grade refactor pass — auth event pattern, real analytics API shapes, artifact cleanup.
---

## Auth redirect — event-based pattern

Never use `window.location.href = "/login"` in `api.ts`. Instead dispatch:
```ts
window.dispatchEvent(new CustomEvent("brainpilot:auth-expired"));
```
`App.tsx` has an `AuthExpiredListener` component (inside `WouterRouter`) that calls `navigate("/login")` on this event.

**Why:** `window.location.href` causes a full page reload, loses Zustand state, and bypasses wouter. The custom event pattern keeps navigation client-side.

**How to apply:** Any place that needs to redirect to login on 401 should dispatch this event, not set `window.location.href`.

---

## Analytics API response shapes (actual, from backend services.py)

```ts
// GET /api/v1/analytics/report/ (quiz performance section)
interface QuizPerformanceResponse {
  summary: { avg_percentage: number; total_attempts: number };
  by_subject: Array<{ subject: string; accuracy: number }>;
}

// GET /api/v1/analytics/report/ (revision section)
interface RevisionStatsResponse {
  due_count: number;
  weak_topics: number;   // NOT weak_topic_count
  mastered: number;      // NOT mastered_count
}
```

**Why:** The existing `RevisionStats` type used `weak_topic_count` / `mastered_count` which don't match what `analytics/services.py` actually returns. Use `RevisionStatsResponse` for the API call, `RevisionStats` for the old type if needed elsewhere.

---

## Legacy artifact directories — removed

Legacy prototype directories were removed. The active app now lives in `frontend/` and `backend/`.

**Why:** The static file path in `backend/config/urls.py` was originally pointing to `artifacts/brainpilot-web/dist/public` (wrong). It now correctly points to `frontend/dist/public`.

---

## DB indexes — already in place

All models had appropriate indexes before the audit. No new migration needed:
- `FocusLog`: `unique_together=[["user","date"]]` creates a composite index
- `StudySession`: `indexes=[("plan","scheduled_date"), ("plan","status")]`
- `Note`: `indexes=[("user","subject"), ("user","is_pinned")]`
- `PomodoroSession`: `indexes=[("user","status")]`
- `StudyPlan`: `indexes=[("user","status"), ("user","start_date")]`

---

## Gemini adapter — native JSON mode

`gemini_adapter.py` uses `response_mime_type="application/json"` in the generation config. Do NOT add regex stripping of markdown code fences — the SDK handles JSON natively.
