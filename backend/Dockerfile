# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM python:3.12-slim AS dependencies

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM python:3.12-slim AS production

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=config.settings.production
ENV PYTHONPATH=/app

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=dependencies /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

RUN groupadd -r brainpilot && useradd -r -g brainpilot brainpilot

COPY . .

RUN mkdir -p logs staticfiles media && \
    chown -R brainpilot:brainpilot /app

RUN python manage.py collectstatic --noinput 2>&1 || true

USER brainpilot

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/live/ || exit 1

CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--timeout", "120", \
     "--keepalive", "5", \
     "--max-requests", "1000", \
     "--max-requests-jitter", "100", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--log-level", "info"]
