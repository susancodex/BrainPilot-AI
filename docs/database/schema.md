# Database Schema

BrainPilot uses PostgreSQL. All tables are managed by Django migrations.

## Overview

| App | Tables |
|-----|--------|
| `accounts` | `accounts_users`, `accounts_user_profiles`, `accounts_email_verification_tokens` |
| `planner` | `planner_study_plans`, `planner_study_sessions` |
| `notes` | `notes_notes`, `notes_flashcards` |
| `quizzes` | `quizzes_quizzes`, `quizzes_questions`, `quizzes_attempts` |
| `chatbot` | `chatbot_conversations`, `chatbot_messages` |
| `goals` | `goals_goals`, `goals_progress_logs` |
| `revision` | `revision_topics`, `revision_logs` |
| `productivity` | `productivity_pomodoro_sessions`, `productivity_focus_logs` |
| `pdfs` | `pdfs_documents` |
| `notifications` | `notifications_notifications` |
| `subscriptions` | `subscriptions_subscriptions` |

## Common Patterns

### Primary Keys

All models use UUID primary keys (`uuid4`) rather than auto-increment integers. This prevents ID enumeration attacks and makes it safe to generate IDs client-side when needed.

### Timestamps

All domain models inherit from `common.base_models.TimeStampedModel` which adds:

```
created_at  DateTimeField   auto_now_add=True
updated_at  DateTimeField   auto_now=True
```

### Ownership

Every user-owned resource has a `user` foreign key to `accounts_users` with `on_delete=CASCADE`. When a user is deleted, all their data is removed automatically.

## Key Tables

### accounts_users

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `email` | varchar(254) | Unique, used as username |
| `first_name` | varchar(100) | |
| `last_name` | varchar(100) | |
| `role` | varchar(20) | `student` or `admin` |
| `is_active` | boolean | Default true |
| `is_email_verified` | boolean | Default false; auto-true in DEBUG mode |
| `failed_login_attempts` | smallint | Reset on successful login |
| `locked_until` | timestamptz | Null when not locked |
| `last_login_ip` | inet | Nullable |
| `created_at` | timestamptz | |

### notes_notes

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | |
| `user` | FK → accounts_users | |
| `title` | varchar(255) | |
| `content` | text | Blank allowed (empty note) |
| `subject` | varchar(100) | Optional categorisation |
| `summary` | text | AI-generated, nullable |
| `created_at` | timestamptz | |

### quizzes_quizzes

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | |
| `user` | FK → accounts_users | |
| `title` | varchar(255) | |
| `subject` | varchar(100) | |
| `topic` | varchar(200) | |
| `difficulty` | varchar(20) | `easy`, `medium`, `hard` |
| `question_count` | smallint | Min 3 |
| `created_at` | timestamptz | |

## Running Migrations

```bash
# Apply all pending migrations
make migrate

# Create migrations after model changes
make makemigrations

# Check for missing migrations
python manage.py migrate --check
```

## Connecting to the Database

```bash
# Using psql with DATABASE_URL
psql $DATABASE_URL

# Via Django shell
python manage.py dbshell
```
