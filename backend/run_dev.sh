#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$SCRIPT_DIR")"
export PYTHONPATH="$SCRIPT_DIR:$PYTHONPATH"
export DJANGO_SETTINGS_MODULE="config.settings.development"
cd "$WORKSPACE_DIR"

PYTHON312="/nix/store/sj74dzrygwdxpb54fv7zc6ry75ay4f3n-python-wrapped-0.1.0/bin/python3"
if [ ! -x "$PYTHON312" ]; then
  PYTHON312=$(python3.12 2>/dev/null || python3 2>/dev/null)
fi

uv run --python "$PYTHON312" python "$SCRIPT_DIR/manage.py" migrate --noinput 2>&1 || true
exec uv run --python "$PYTHON312" python "$SCRIPT_DIR/manage.py" runserver "0.0.0.0:8000"
