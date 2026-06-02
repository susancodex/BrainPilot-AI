---
name: BrainPilot frontend coverage
description: All hooks, pages, and features added in the complete backend coverage pass; includes QA audit field-mismatch fixes
---

**All hooks now implemented (src/hooks/):**
- use-auth: register, login, logout, verifyEmail, passwordResetRequest, passwordResetConfirm, changePassword, useMe, updateProfile
- use-notes: notes CRUD, summarizeNote, generateFlashcards (`/notes/${id}/flashcards/generate/`), dueFlashcards, reviewFlashcard, **useFlashcards** (GET /notes/flashcards/)
- use-goals: goals CRUD, updateGoalProgress, completeMilestone, single goal detail
- use-revision: topics CRUD, dueTopics, weakTopics, recordRevision (full fields: topic_id, duration_minutes, confidence_after)
- use-productivity: startPomodoro, completePomodoro (by ID), completeSession, streak, focusLogs
- use-analytics: trends, subjects, quizPerformance, revisionStats, report
- use-notifications: list, markRead, markAllRead
- use-chat: conversations, conversationDetail, sendMessage (`content` field, NOT `message`), deleteConversation, useCreateConversation
- use-planner: plans CRUD, generatePlan (subjects array, start_date, end_date, plan_type, daily_hours), sessions, updateSession
- use-quizzes: list, generate (subject, topic, question_count, difficulty), detail, submit, attempts

**Pages (src/pages/):**
All 13+ pages complete. Admin portal at `/admin/users` (staff-only guard via `Redirect`).

**Layout & Routing:**
- `layout.tsx` exports both `default Layout` (internal) AND named `AppLayout` — App.tsx uses `import { AppLayout }`
- `App.tsx` wraps all authenticated routes in `<AppLayout>`, includes `/admin/users`
- wouter has no `useNavigate` — use `Redirect` for guards instead

**CSS (index.css):**
- 3D flip classes: `.perspective-1000`, `.transform-style-3d`, `.backface-hidden`, `.rotate-y-180`
- TipTap ProseMirror prose styles (headings, lists, task list)

**Key constraints:**
- TipTap v3.24.0: BubbleMenu NOT exported from `@tiptap/react` main index — do not import it
- useMe query must have `enabled: !!getAccessToken()` to prevent redirect loops on public pages
- Chat API field is `content` (NOT `message`); send endpoint: POST /chatbot/send/ with `{content, conversation_id}`
- Notes flashcard URL is `/notes/${id}/flashcards/generate/` (NOT `generate_flashcards/`)

**QA Audit field-mismatch fixes (applied):**
- `revision.tsx`: `topic.next_review_date` → `topic.next_revision_at`; `topic.is_due` → computed from `next_revision_at <= now`
- `analytics.tsx` quiz performance: `quizPerf.avg_percentage` → `quizPerf.summary.avg_percentage`; `quizPerf.quiz_count` → `quizPerf.summary.total_attempts`; chart uses `by_subject` (subject accuracy bars) instead of non-existent `trend`
- `analytics.tsx` revision stats: `revStats.weak_topic_count` → `revStats.weak_topics`; `revStats.mastered_count` → `revStats.mastered`; `revStats.due_count` now provided by backend
- Backend `analytics/services.py`: added `due_count` field to `get_revision_stats()` (counts topics where `next_revision_at <= now`)

**API response shapes (post-interceptor unwrap):**
- Quiz performance: `{summary: {avg_percentage, total_attempts, total_questions}, by_subject: [{subject, accuracy}]}`
- Revision stats: `{total_topics, due_count, weak_topics, avg_confidence, mastered}`
- Revision topic fields: `id, subject, topic, confidence_level, revision_count, last_revised_at, next_revision_at, is_weak, notes, created_at`

**Why:** Backend had 19+ endpoints with no frontend coverage; QA audit found 8+ field-name mismatches between frontend and backend that caused silent rendering bugs (Invalid Date, wrong 0 counts).
