# Deployment Guide

## Prerequisites

- PostgreSQL 15+ database
- Redis 7+ (for Celery task queue)
- Python 3.12 runtime
- Node.js 20+ (for building the frontend)

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and set all required variables. See the [Environment Variables](../../README.md#environment-variables) section of the README.

For production, ensure:

- `DJANGO_SETTINGS_MODULE=config.settings.production`
- `DJANGO_SECRET_KEY` is a randomly generated 50+ character string
- `DEBUG` is not set (defaults to `False` in production settings)
- `ALLOWED_HOSTS` includes your domain(s)
- `CORS_ALLOWED_ORIGINS` includes your frontend origin

## Option 1 — Docker Compose

The simplest way to run the full stack locally or on a single server.

```bash
cd backend
cp .env.example .env
# Edit .env

docker-compose up --build
```

This starts:
- `db` — PostgreSQL on port 5432
- `redis` — Redis on port 6379
- `api` — Django + Gunicorn on port 8000
- `celery` — Celery worker
- `celery-beat` — Celery beat scheduler

### Build and deploy the frontend separately

```bash
pnpm --filter @workspace/brainpilot-web run build
# Serve frontend/dist/ with nginx, Caddy, or similar
```

Configure your reverse proxy to:
- Serve `frontend/dist/` for all non-API routes
- Proxy `/api/*` and `/media/*` to `http://localhost:8000`

## Option 2 — Render.com

A `render.yaml` file in `backend/deployment/` defines the full stack for one-click deployment:

```bash
# From the Render dashboard:
# 1. Connect your GitHub repository
# 2. Select "Use Infrastructure as Code"
# 3. Point to backend/deployment/render.yaml
# 4. Add GEMINI_API_KEY as a secret environment variable
```

The config provisions:
- Web service (Django + Gunicorn)
- Redis instance
- Celery worker
- PostgreSQL database

## Option 3 — Manual VPS

### Backend

```bash
# 1. Clone repo and install dependencies
git clone https://github.com/your-org/brainpilot.git
cd brainpilot/backend
pip install uv && uv sync --no-dev

# 2. Configure environment
cp .env.example .env && nano .env

# 3. Collect static files and run migrations
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py collectstatic --noinput
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py migrate

# 4. Start with Gunicorn (via systemd or supervisor)
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4 --timeout 120
```

### Frontend

```bash
# Build
pnpm --filter @workspace/brainpilot-web run build

# Serve frontend/dist/ with nginx
# Example nginx config:
cat > /etc/nginx/sites-available/brainpilot << 'EOF'
server {
    listen 80;
    server_name yourdomain.com;

    root /path/to/brainpilot/frontend/dist/public;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /media/ {
        proxy_pass http://127.0.0.1:8000;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
```

## Database Migrations

Always run migrations before starting a new release:

```bash
python manage.py migrate --noinput
```

Never run `makemigrations` in production. Migration files are generated locally and committed to version control.

## Static Files

```bash
python manage.py collectstatic --noinput
```

WhiteNoise serves static files directly from Gunicorn in production — no separate static file server needed for the API.

## Health Checks

```bash
# Backend liveness
curl https://yourdomain.com/health/

# AI gateway status
curl -H "Authorization: Bearer <token>" https://yourdomain.com/api/v1/ai/health/
```

## Scaling

- **API**: add Gunicorn workers (`--workers` = 2 × CPU cores + 1)
- **Celery**: run multiple workers with `--concurrency`
- **Database**: enable connection pooling (PgBouncer recommended for > 50 concurrent users)
- **Static files**: put a CDN in front of the media endpoint for uploaded PDFs/avatars

## Rollback

1. Re-deploy the previous Docker image or git revision
2. If the release included a migration, run `python manage.py migrate <app> <previous_migration>`
