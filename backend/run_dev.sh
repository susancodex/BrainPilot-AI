#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$SCRIPT_DIR")"
export PYTHONPATH="$SCRIPT_DIR:$PYTHONPATH"
export DJANGO_SETTINGS_MODULE="config.settings.development"
cd "$WORKSPACE_DIR"
uv run python "$SCRIPT_DIR/manage.py" migrate --noinput 2>&1 || true
exec uv run python "$SCRIPT_DIR/manage.py" runserver "0.0.0.0:8000"
