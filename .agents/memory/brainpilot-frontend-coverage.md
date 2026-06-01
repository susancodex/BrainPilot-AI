---
name: BrainPilot frontend coverage
description: All hooks, pages, and features added in the complete backend coverage pass
---

**All hooks now implemented (src/hooks/):**
- use-auth: register, login, logout, verifyEmail, passwordResetRequest, passwordResetConfirm, changePassword, useMe, updateProfile
- use-notes: notes CRUD, summarizeNote, generateFlashcards, dueFlashcards, reviewFlashcard
- use-goals: goals CRUD, updateGoalProgress, completeMilestone, single goal detail
- use-revision: topics CRUD, dueTopics, weakTopics, recordRevision (full fields)
- use-productivity: startPomodoro, completePomodoro (by ID), completeSession, streak, focusLogs
- use-analytics: trends, subjects, quizPerformance, revisionStats, report
- use-notifications: list, markRead, markAllRead
- use-chat: conversations, conversationDetail, sendMessage, deleteConversation
- use-planner: plans CRUD, generatePlan (fixed payload), sessions, updateSession
- use-quizzes: list, generate, detail, submit, attempts

**Pages (src/pages/):**
13 original + 4 new: verify-email, password-reset, password-reset-confirm, flashcards

**Key auth pattern:** useMe query must have `enabled: !!getAccessToken()` to prevent redirect loops on public pages.

**Why:** Backend had 19+ endpoints with no frontend coverage; chat had wrong field name causing all AI messages to silently fail.
