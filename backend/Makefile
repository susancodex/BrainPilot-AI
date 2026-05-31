PYTHON        = python
MANAGE        = $(PYTHON) manage.py
SETTINGS_DEV  = config.settings.development
SETTINGS_PROD = config.settings.production
export PYTHONPATH := $(shell pwd):$(PYTHONPATH)
export DJANGO_SETTINGS_MODULE ?= $(SETTINGS_DEV)

# ── Dev server ────────────────────────────────────────────────────────────────
.PHONY: run
run:
	$(MANAGE) runserver 0.0.0.0:8000

# ── Database ──────────────────────────────────────────────────────────────────
.PHONY: migrate makemigrations
migrate:
	$(MANAGE) migrate

makemigrations:
	$(MANAGE) makemigrations

# ── Static & shell ────────────────────────────────────────────────────────────
.PHONY: collectstatic shell
collectstatic:
	$(MANAGE) collectstatic --noinput

shell:
	$(MANAGE) shell

# ── Superuser ────────────────────────────────────────────────────────────────
.PHONY: createsuperuser
createsuperuser:
	$(MANAGE) createsuperuser

# ── Code quality ─────────────────────────────────────────────────────────────
.PHONY: lint format check
lint:
	ruff check .

format:
	ruff format .

check:
	$(MANAGE) check --deploy DJANGO_SETTINGS_MODULE=$(SETTINGS_PROD)

# ── Clean ─────────────────────────────────────────────────────────────────────
.PHONY: clean
clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	rm -rf staticfiles/

.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make run              Start dev server on :8000"
	@echo "  make migrate          Apply DB migrations"
	@echo "  make makemigrations   Create new migrations"
	@echo "  make shell            Django interactive shell"
	@echo "  make createsuperuser  Create admin user"
	@echo "  make collectstatic    Collect static files"
	@echo "  make lint             Run ruff linter"
	@echo "  make format           Run ruff formatter"
	@echo "  make check            Run deploy checks"
	@echo "  make clean            Remove .pyc / __pycache__"
