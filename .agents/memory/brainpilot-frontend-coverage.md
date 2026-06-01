---
name: BrainPilot frontend coverage
description: All hooks, pages, and features added in the complete backend coverage pass
---

**All hooks now implemented (src/hooks/):**
- use-auth: register, login, logout, verifyEmail, passwordResetRequest, passwordResetConfirm, changePassword, useMe, updateProfile
- use-notes: notes CRUD, summarizeNote, generateFlashcards, dueFlashcards, reviewFlashcard, **useFlashcards** (GET /notes/flashcards/)
- use-goals: goals CRUD, updateGoalProgress, completeMilestone, single goal detail
- use-revision: topics CRUD, dueTopics, weakTopics, recordRevision (full fields)
- use-productivity: startPomodoro, completePomodoro (by ID), completeSession, streak, focusLogs
- use-analytics: trends, subjects, quizPerformance, revisionStats, report
- use-notifications: list, markRead, markAllRead
- use-chat: conversations, conversationDetail, sendMessage, deleteConversation, useCreateConversation
- use-planner: plans CRUD, generatePlan (fixed payload), sessions, updateSession
- use-quizzes: list, generate, detail, submit, attempts

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
- Chat API field is `conversation_id` (snake_case), not `conversationId`

**Why:** Backend had 19+ endpoints with no frontend coverage; chat had wrong field name causing all AI messages to silently fail.
