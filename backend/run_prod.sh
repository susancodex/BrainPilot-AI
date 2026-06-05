#!/usr/bin/env bash
# ── BrainPilot AI — Production Startup Script ─────────────────────────────────
# Used by Render and Docker entrypoints.
# Runs migrations then starts Gunicorn.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PYTHONPATH="${SCRIPT_DIR}:${PYTHONPATH:-}"
export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-config.settings.production}"

log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*"; }

log "Starting BrainPilot AI production server"
log "Settings: ${DJANGO_SETTINGS_MODULE}"

# Validate required environment variables
for var in DJANGO_SECRET_KEY DATABASE_URL; do
    if [ -z "${!var:-}" ]; then
        log "ERROR: Required environment variable '${var}' is not set."
        exit 1
    fi
done

if [ -z "${GEMINI_API_KEY:-}" ] && [ -z "${GROQ_API_KEY:-}" ] && [ -z "${OPENROUTER_API_KEY:-}" ]; then
    log "ERROR: Set at least one of GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY."
    exit 1
fi

cd "${SCRIPT_DIR}"

# Run database migrations
log "Running database migrations..."
python manage.py migrate --noinput

# Collect static files (idempotent)
log "Collecting static files..."
python manage.py collectstatic --noinput --clear 2>/dev/null || \
python manage.py collectstatic --noinput

# Determine worker count: 2 × CPU cores + 1, capped at 8
CPU_CORES="${CPU_CORES:-$(python -c 'import os; print(os.cpu_count() or 2)')}"
WORKERS="${GUNICORN_WORKERS:-$(( CPU_CORES * 2 + 1 ))}"
if [ "${WORKERS}" -gt 8 ]; then WORKERS=8; fi

log "Starting Gunicorn with ${WORKERS} workers on port ${PORT:-8000}"

exec gunicorn config.wsgi:application \
    --bind "0.0.0.0:${PORT:-8000}" \
    --workers "${WORKERS}" \
    --timeout 120 \
    --keepalive 5 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
