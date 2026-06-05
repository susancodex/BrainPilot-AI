#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$SCRIPT_DIR")"
export PYTHONPATH="$SCRIPT_DIR:$PYTHONPATH"
export DJANGO_SETTINGS_MODULE="config.settings.development"
if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/.env"
  set +a
fi
cd "$WORKSPACE_DIR"

# Sync dependencies once using Python 3.11
uv sync --python python3.11

# Run migrations using the synced environment
uv run --no-sync python "$SCRIPT_DIR/manage.py" migrate --noinput 2>&1 || true

# Start the dev server
exec uv run --no-sync python "$SCRIPT_DIR/manage.py" runserver "0.0.0.0:8000"
