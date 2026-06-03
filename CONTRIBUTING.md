# Contributing to BrainPilot AI

Thank you for taking the time to contribute. This document covers everything you need to get a change from idea to merged pull request.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

---

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). All contributors are expected to uphold it.

---

## Getting Started

1. **Fork** the repository and clone your fork locally
2. Follow the [Local Development Setup](README.md#local-development-setup) in the README
3. Create a new branch from `main` for your change:

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/issue-description
```

---

## Development Workflow

### Branch naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<description>` | `feat/pdf-search` |
| Bug fix | `fix/<description>` | `fix/quiz-submit-error` |
| Docs | `docs/<description>` | `docs/api-reference` |
| Refactor | `refactor/<description>` | `refactor/auth-service` |
| Chore | `chore/<description>` | `chore/update-deps` |

### Running the project locally

See [README.md — Local Development Setup](README.md#local-development-setup).

### Before pushing

```bash
# Backend
cd backend
make lint       # ruff check
make format     # ruff format
make test       # pytest

# Frontend
pnpm typecheck  # TypeScript check across workspace
```

---

## Commit Conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`

**Examples:**

```
feat(quizzes): add short-answer question type to AI generation
fix(auth): prevent account lockout on case-insensitive email mismatch
docs(api): add missing pagination parameters to notes endpoint
chore(deps): upgrade django to 6.0.1
```

Breaking changes must include `BREAKING CHANGE:` in the commit footer.

---

## Pull Request Process

1. **Open a draft PR early** — this signals active work and allows early feedback
2. **Fill in the PR template** completely — incomplete PRs will be returned
3. **Keep PRs focused** — one logical change per PR. Split large changes
4. **Ensure CI passes** — all GitHub Actions checks must be green
5. **Request a review** — at least one approval is required to merge
6. **Squash on merge** — PRs are squash-merged to keep a clean history

### PR checklist

- [ ] Tests added or updated for all changed behaviour
- [ ] No new linting errors (`make lint` passes)
- [ ] TypeScript compiles without errors (`pnpm typecheck`)
- [ ] `CHANGELOG.md` updated under `[Unreleased]`
- [ ] Documentation updated if public API changed
- [ ] No secrets or credentials committed

---

## Coding Standards

### Backend (Python / Django)

- **Style**: [ruff](https://docs.astral.sh/ruff/) for linting and formatting (see `pyproject.toml`)
- **Architecture**: thin views — all business logic in `services.py`, all AI logic in `services/ai_engine/`
- **No direct AI calls in views** — always route through the gateway via the `GeminiAdapter`
- **Serializers validate; services execute** — keep serializer `validate()` methods free of side effects
- **Migrations**: always run `make makemigrations` after model changes; never hand-edit migration files
- **Type hints**: use them on all new functions and method signatures

### Frontend (TypeScript / React)

- **API calls** live exclusively in `src/hooks/` — never directly in page or component files
- **No business logic in components** — components render, hooks fetch and transform
- **Zustand for global state** — TanStack Query for server state; don't mix them
- **shadcn/ui conventions** — extend existing components before creating new ones
- **Imports**: use the `@/` alias for `src/` imports

---

## Testing Requirements

### Backend

- All new service-layer functions must have unit tests
- New API endpoints must have integration tests using `APIClient`
- Use the shared fixtures in `tests/conftest.py` — do not create one-off `User` objects in test files
- Minimum coverage for new code: 80%

### Frontend

- New hooks must be tested for loading, success, and error states
- Component tests for non-trivial UI logic

---

## Reporting Bugs

Use the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) issue template. Include:

- Steps to reproduce
- Expected vs. actual behaviour
- Environment details (OS, browser, Python/Node versions)
- Relevant logs or screenshots

---

## Requesting Features

Use the [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md) issue template. Describe the problem you want solved, not just the solution — this helps us find the best approach together.

---

## Questions

Open a [GitHub Discussion](https://github.com/your-org/brainpilot/discussions) for questions that aren't bugs or feature requests.
