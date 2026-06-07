#!/usr/bin/env bash
# ── BrainPilot AI — Render Build Script ───────────────────────────────────────
# Called by Render's buildCommand on every deploy.
# Runs in the repo root. Python deps are installed into the build environment.
set -euo pipefail

log() { echo "[BUILD $(date -u '+%H:%M:%S')] $*"; }

# ── 1. Node.js + pnpm ─────────────────────────────────────────────────────────
log "Setting up Node.js 20..."
export NVM_DIR="${HOME}/.nvm"
if [ -s "${NVM_DIR}/nvm.sh" ]; then
    # shellcheck source=/dev/null
    source "${NVM_DIR}/nvm.sh"
    nvm install 20
    nvm use 20
else
    log "nvm not found — attempting system node (may be older)"
fi

log "Installing pnpm..."
npm install -g pnpm@10 --silent
node --version
pnpm --version

# ── 2. Build React frontend ────────────────────────────────────────────────────
log "Installing frontend dependencies..."
pnpm install --no-frozen-lockfile

log "Building React SPA..."
pnpm --filter @workspace/brainpilot-web run build

FRONTEND_DIST="frontend/dist/public"
if [ ! -f "${FRONTEND_DIST}/index.html" ]; then
    log "ERROR: Frontend build did not produce index.html — check vite output above."
    exit 1
fi
log "Frontend build OK → ${FRONTEND_DIST}"

# ── 3. Python dependencies ─────────────────────────────────────────────────────
log "Installing Python dependencies..."
pip install --upgrade pip --quiet
pip install -r backend/requirements/production.txt

# ── 4. Django collectstatic ────────────────────────────────────────────────────
log "Collecting Django static files..."
cd backend
DJANGO_SETTINGS_MODULE=config.settings.production \
    python manage.py collectstatic --noinput
cd ..

log "Build complete ✓"
