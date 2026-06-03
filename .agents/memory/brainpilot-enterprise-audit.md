---
name: BrainPilot Enterprise Audit
description: Full enterprise audit findings and all fixes applied across security, performance, type safety, and frontend correctness.
---

## Security fixes applied
- `PasswordResetConfirmView` + `VerifyEmailView` — both now have `throttle_scope = "auth"` (prevents token brute-force)
- `LivenessCheckView` — Python version removed from response (info disclosure)
- `production.py` — `SECURE_HSTS_PRELOAD = True`, `DATA_UPLOAD_MAX_MEMORY_SIZE = 10MB`, `FILE_UPLOAD_MAX_MEMORY_SIZE = 10MB`

## N+1 query fixes applied
- `dashboard/services.py` — 3 separate `Goal.count()` → single `aggregate()` with CASE/WHEN
- `chatbot/services.py` — `get_user_conversations` uses `Prefetch("messages", to_attr="_last_assistant_msgs")` + `order_by("-last_message_at")`
- `chatbot/serializers.py` — `get_last_message` reads from prefetch attr, DB fallback for detail views
- `notes/serializers.py` — `get_flashcard_count` reads from `_prefetched_objects_cache` (avoids extra COUNT query)

## Input validation added
- `notes/serializers.py` — `title` max_length=500, `content` max_length=500_000

## Frontend bug fixes applied
- `notes.tsx` auto-save `useEffect` — added `selectedId` to deps (was stale closure risk)
- `lib/auth.ts` — `isAuthenticated` buffer 5s → 30s (network/clock skew tolerance)
- `App.tsx` — QueryClient: smart retry skips 401/403; `staleTime: 30_000` added globally

## Type safety fixes applied
- `quizzes.tsx` — all `(q as any)` replaced with `QuizQuestion` typed interface
- `admin/users.tsx` — `date_joined` → `created_at` (backend serializer returns `created_at`)
- `rich-text-editor.tsx` — `setContent(content, false)` → `setContent(content)` (TipTap API changed)

**Why:** TipTap `setContent` second argument changed from `emitUpdate: boolean` to `SetContentOptions` object in newer versions; passing `false` causes a TS2559 type error.

## Remaining known non-issues
- `stream_message` user message intentionally kept on AI failure (user did send it; UI handles gracefully)
- drf-spectacular W001/W002 warnings are cosmetic OpenAPI schema hints; no runtime impact
