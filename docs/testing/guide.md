# Testing Guide

## Overview

The backend test suite uses **pytest** with **pytest-django**. All tests live in `backend/tests/`.

## Running Tests

```bash
cd backend

# All tests
make test

# With coverage report (HTML + terminal)
make test-cov

# Fast mode — stop on first failure
make test-fast

# Specific file
pytest tests/test_api_auth.py -v

# Specific test
pytest tests/test_notes_service.py::test_create_note -v

# With keyword filter
pytest -k "quiz" -v
```

## Test Structure

```
backend/tests/
├── conftest.py             Shared fixtures (users, api clients, domain objects)
├── test_api_auth.py        Auth endpoint integration tests
├── test_notes_service.py   Notes service unit tests
├── test_quizzes_service.py Quiz service unit tests (mocked AI)
├── test_dashboard_service.py Dashboard aggregation tests
└── test_productivity_service.py Pomodoro and streak tests
```

## Writing Tests

### Fixtures

Shared fixtures are in `tests/conftest.py`. Use them directly — do not create `User.objects.create_user()` calls inline in test files.

```python
def test_note_belongs_to_user(auth_client, user, note):
    response = auth_client.get(f"/api/v1/notes/{note.id}/")
    assert response.status_code == 200
    assert response.data["data"]["title"] == note.title
```

Available fixtures:

| Fixture | Type | Description |
|---------|------|-------------|
| `user` | `User` | Standard student user |
| `second_user` | `User` | Second user for isolation tests |
| `admin_user` | `User` | Superuser |
| `api_client` | `APIClient` | Unauthenticated DRF client |
| `auth_client` | `APIClient` | Client authenticated as `user` |
| `admin_client` | `APIClient` | Client authenticated as `admin_user` |
| `note` | `Note` | Sample note owned by `user` |
| `completed_pomodoro` | `PomodoroSession` | Completed Pomodoro session |

### Testing AI-dependent code

Mock the AI gateway when testing service code to avoid real API calls and make tests deterministic:

```python
from unittest.mock import patch

def test_quiz_generation(auth_client, user):
    mock_quiz = {
        "title": "Chemistry Quiz",
        "questions": [
            {
                "question": "What is H2O?",
                "type": "mcq",
                "options": ["Water", "Oxygen", "Hydrogen", "Carbon"],
                "correct_answer": "Water",
                "explanation": "H2O is the chemical formula for water."
            }
        ]
    }
    with patch("apps.quizzes.services.get_gateway") as mock_gw:
        mock_gw.return_value.generate_json.return_value = mock_quiz
        response = auth_client.post("/api/v1/quizzes/generate/", {
            "subject": "Chemistry",
            "topic": "Molecular Formulae",
            "question_count": 3,
            "difficulty": "easy"
        }, format="json")

    assert response.status_code == 201
```

### Testing ownership isolation

Always verify that a user cannot access another user's data:

```python
def test_note_isolation(auth_client, second_user):
    other_note = Note.objects.create(user=second_user, title="Other note", content="...")
    response = auth_client.get(f"/api/v1/notes/{other_note.id}/")
    assert response.status_code == 404
```

## Coverage

The CI pipeline requires **70% minimum coverage** across `apps/`, `services/`, and `ai/`. Run locally to check before pushing:

```bash
pytest tests/ --cov=apps --cov=services --cov=ai --cov-report=term-missing
```

Generate an HTML report for detailed line-level coverage:

```bash
make test-cov
open htmlcov/index.html
```

## Test Configuration

pytest settings are in `backend/pyproject.toml`:

```toml
[tool.pytest.ini_options]
DJANGO_SETTINGS_MODULE = "config.settings.development"
pythonpath = ["."]
addopts = "--tb=short"
```

## CI Integration

Tests run automatically on every push and pull request via `.github/workflows/ci.yml` and `.github/workflows/test.yml`. Coverage reports are uploaded to Codecov.
