# Contributing to BrainPilot AI

Thank you for your interest in contributing. This document covers the contribution workflow, coding standards, and review process.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating you agree to uphold its standards.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/brainpilot.git`
3. Follow the [Local Development](README.md#local-development) setup in the README
4. Create a feature branch from `main`: `git checkout -b feat/your-feature-name`

## Development Workflow

```
main ← pull requests only (protected)
  └─ feat/<name>   feature branches
  └─ fix/<name>    bug fix branches
  └─ chore/<name>  tooling, deps, docs
  └─ docs/<name>   documentation-only changes
```

- Keep branches focused — one logical change per PR
- Rebase on `main` before opening a PR to avoid merge conflicts
- All CI checks must pass before a PR can be merged

## Coding Standards

### Backend (Python)

- Follow [PEP 8](https://peps.python.org/pep-0008/) — enforced by `ruff`
- All business logic belongs in `services.py` per app — views stay thin
- All AI logic belongs in `services/ai_engine/` or `ai/`
- No database queries in views or serializers — use the service layer
- Every new model must have a migration
- Every new endpoint must have at least one integration test

```bash
cd backend
make lint      # ruff check
make format    # ruff format
make test      # pytest
```

### Frontend (TypeScript / React)

- Strict TypeScript — no `any` unless unavoidable
- All API calls go through hooks in `frontend/src/hooks/`
- No business logic in page components — extract to hooks
- Components stay presentational; data-fetching lives in hooks
- Use the existing shadcn/ui component library before adding new dependencies

```bash
pnpm --filter @workspace/brainpilot-web run typecheck
```

### General

- No commented-out code in committed files
- No `console.log` / `print` debug statements in committed code
- Prefer explicit over implicit — name things clearly

## Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`

**Examples:**

```
feat(quizzes): add short-answer question type
fix(auth): correct token expiry on concurrent refresh
docs(api): update flashcard review endpoint docs
chore(deps): bump google-genai to 2.8.0
```

- Use imperative mood in the summary ("add" not "adds" or "added")
- Keep the summary under 72 characters
- Reference issues in the footer: `Closes #42`

## Pull Request Process

1. Ensure all CI checks pass (lint, tests, type-check)
2. Update `CHANGELOG.md` under `[Unreleased]` with a summary of your changes
3. Update relevant documentation in `docs/` if your change affects architecture or APIs
4. Request a review from at least one maintainer
5. Address review comments promptly — mark conversations as resolved when done
6. Squash commits before merging if the history is noisy

## Reporting Bugs

Use the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) issue template. Include:

- Steps to reproduce
- Expected vs actual behaviour
- Environment (OS, browser, Python/Node versions)
- Relevant logs or error messages

## Requesting Features

Use the [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md) issue template. Describe:

- The problem you are trying to solve
- The proposed solution
- Alternatives you have considered
- Any relevant context or mockups
