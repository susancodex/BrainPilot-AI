#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PYTHONPATH="$SCRIPT_DIR:$PYTHONPATH"
export DJANGO_SETTINGS_MODULE="config.settings.development"
exec python "$SCRIPT_DIR/manage.py" runserver "0.0.0.0:8000"
