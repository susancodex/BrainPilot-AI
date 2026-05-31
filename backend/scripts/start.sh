#!/usr/bin/env bash
# Production startup script — runs Django migrations then starts Gunicorn
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

export PYTHONPATH="$BACKEND_DIR:${PYTHONPATH:-}"
export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-config.settings.production}"

PORT="${PORT:-8000}"
WORKERS="${WEB_CONCURRENCY:-2}"
TIMEOUT="${GUNICORN_TIMEOUT:-120}"

echo "Running migrations..."
python "$BACKEND_DIR/manage.py" migrate --noinput

echo "Collecting static files..."
python "$BACKEND_DIR/manage.py" collectstatic --noinput --clear

echo "Starting Gunicorn on port $PORT with $WORKERS workers..."
exec gunicorn config.wsgi:application \
    --bind "0.0.0.0:$PORT" \
    --workers "$WORKERS" \
    --timeout "$TIMEOUT" \
    --keep-alive 5 \
    --log-level info \
    --access-logfile - \
    --error-logfile - \
    --forwarded-allow-ips="*"
