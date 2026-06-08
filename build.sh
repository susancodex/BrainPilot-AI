#!/usr/bin/env bash
# ── BrainPilot AI — Render Backend Build Script ───────────────────────────────
# Frontend (React/Vite) is deployed separately on Vercel.
# This script only builds the Django backend for Render.
set -euo pipefail

log() { echo "[BUILD $(date -u '+%H:%M:%S')] $*"; }

# ── Python dependencies ────────────────────────────────────────────────────────
log "Installing Python dependencies..."
pip install --upgrade pip --quiet
pip install -r backend/requirements/production.txt

# ── Django collectstatic ───────────────────────────────────────────────────────
log "Collecting Django static files (admin panel, DRF browseable API, etc.)..."
cd backend
DJANGO_SETTINGS_MODULE=config.settings.production \
    python manage.py collectstatic --noinput
cd ..

log "Build complete ✓"
