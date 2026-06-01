---
name: BrainPilot API routing
description: Correct URL prefixes for all Django apps and key serializer field names
---

All routes are under `/api/v1/` prefix. Auth app is mounted at `/api/v1/auth/` (NOT `/api/v1/accounts/`).

**URL prefixes:**
- Auth: `/api/v1/auth/`
- Planner: `/api/v1/planner/`
- Goals: `/api/v1/goals/`
- Revision: `/api/v1/revision/`
- Notes: `/api/v1/notes/`
- Quizzes: `/api/v1/quizzes/`
- Chatbot: `/api/v1/chatbot/`
- Analytics: `/api/v1/analytics/`
- Productivity: `/api/v1/productivity/`
- Dashboard: `/api/v1/dashboard/`
- Notifications: `/api/v1/notifications/`
- Token refresh: `/api/v1/token/refresh/`

**Critical field name bugs fixed:**
- Chat send uses `content` (NOT `message`)
- Log session uses `focus_minutes` (NOT `duration_minutes`) + `subject` + `task_description`
- Complete pomodoro uses `pomodoros_completed`
- Record revision needs `topic_id`, `duration_minutes`, `confidence_after` (1-5), `notes`
- Generate plan needs `subjects` (list), `start_date`, `end_date`, `plan_type`, `daily_hours`

**Why:** These were discovered during backend-first coverage pass; frontend had wrong field names that would silently fail or get 400 errors.
