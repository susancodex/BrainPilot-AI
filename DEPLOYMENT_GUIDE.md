# BrainPilot AI — Deployment Guide

**Architecture:**
- **Frontend** → [Vercel](https://vercel.com) (React + Vite + TypeScript)
- **Backend API** → [Render](https://render.com) (Django + Gunicorn + WhiteNoise)
- **Database** → [Neon](https://neon.tech) (PostgreSQL, serverless)

---

## Step 1 — Create the Neon PostgreSQL Database

1. Go to [neon.tech](https://neon.tech) → Sign up / Log in (free tier available)
2. Click **New Project**
3. Name it `brainpilot`
4. Choose a region close to your Render region (e.g. **US East** for `oregon`)
5. Click **Create project**
6. On the project dashboard, click **Connection string** → copy the full string:
   ```
   postgresql://user:pass@ep-xxx-xxx.us-east-2.aws.neon.tech/brainpilot?sslmode=require
   ```
7. **Save this string** — you will use it as `DATABASE_URL` on Render

> Neon's free tier gives you 0.5 GB storage, 1 compute unit, and unlimited branches.

---

## Step 2 — Generate a Django Secret Key

Run this locally (requires Python):
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```
Save the output — this will be your `DJANGO_SECRET_KEY` on Render.

---

## Step 3 — Push Code to GitHub

```bash
git add .
git commit -m "chore: production deployment setup (Vercel + Render + Neon)"
git push origin main
```

---

## Step 4 — Deploy Django Backend to Render

### 4a. Create the Render service via Blueprint
1. Go to [render.com](https://render.com) → **New +** → **Blueprint**
2. Connect your GitHub account (if not already connected)
3. Select your **BrainPilot AI** repository
4. Render detects `render.yaml` automatically → click **Apply**
5. The `brainpilot-api` web service is created on the **free plan**

### 4b. Set Required Environment Variables
In the Render dashboard → **brainpilot-api** → **Environment** → add:

| Variable | Value |
|---|---|
| `DJANGO_SECRET_KEY` | The key you generated in Step 2 |
| `DATABASE_URL` | The Neon connection string from Step 1 |
| `GEMINI_API_KEY` | Your key from [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `GROQ_API_KEY` | *(optional)* from [console.groq.com](https://console.groq.com/keys) |
| `OPENROUTER_API_KEY` | *(optional)* from [openrouter.ai](https://openrouter.ai/keys) |

Click **Save Changes** — Render triggers a new deploy.

### 4c. Verify the backend is live
Once the deploy finishes (watch the **Deploy Logs** tab):
```
https://brainpilot-api.onrender.com/api/v1/live/
```
Expected response: `{"success": true, "message": "BrainPilot AI is operational", ...}`

> **Note:** The free plan spins down after 15 minutes of inactivity. The first request
> after idle takes ~30 seconds to wake up. This is normal.

---

## Step 5 — Deploy React Frontend to Vercel

### 5a. Import the project
1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository
3. In the **Configure Project** screen set:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite  
   - **Build Command:** `cd .. && pnpm install --no-frozen-lockfile && pnpm --filter @workspace/brainpilot-web run build`
   - **Output Directory:** `dist/public`
   - **Install Command:** *(leave blank — handled by build command)*

### 5b. Set Frontend Environment Variables
In Vercel → **Project Settings** → **Environment Variables** → add:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://brainpilot-api.onrender.com` |

Click **Save**, then **Redeploy**.

### 5c. Note your Vercel URL
After deployment completes, Vercel gives you a URL like:
```
https://brainpilot.vercel.app
```

---

## Step 6 — Wire Frontend URL into the Backend (CORS + CSRF)

Go back to **Render** → **brainpilot-api** → **Environment** → add/update:

| Variable | Value |
|---|---|
| `CORS_ALLOWED_ORIGINS` | `https://brainpilot.vercel.app` |
| `CSRF_TRUSTED_ORIGINS` | `https://brainpilot.vercel.app,https://brainpilot-api.onrender.com` |
| `FRONTEND_URL` | `https://brainpilot.vercel.app` |

Click **Save Changes** — Render redeploys automatically.

---

## Step 7 — Verify End-to-End

1. Open `https://brainpilot.vercel.app`
2. Click **Create free account** — register a test user
3. Log in and confirm you reach the Dashboard
4. Try creating a note, quiz, or chatting with the AI assistant

**Backend health endpoints:**
| Endpoint | Purpose |
|---|---|
| `/api/v1/live/` | Liveness — is Django running? |
| `/api/v1/ready/` | Readiness — DB connected? |
| `/api/v1/health/` | Full health check |
| `/api/docs/` | Swagger UI (all API endpoints) |

---

## All Required Environment Variables

### Render (Backend)
| Variable | Required | Description |
|---|---|---|
| `DJANGO_SECRET_KEY` | ✅ Yes | Django cryptographic key (min 50 chars) |
| `DATABASE_URL` | ✅ Yes | Neon PostgreSQL connection string |
| `GEMINI_API_KEY` | ✅ Yes | Primary AI provider |
| `CORS_ALLOWED_ORIGINS` | ✅ Yes | Vercel frontend URL |
| `CSRF_TRUSTED_ORIGINS` | ✅ Yes | Vercel + Render URLs |
| `FRONTEND_URL` | ✅ Yes | Vercel frontend URL |
| `GROQ_API_KEY` | Optional | AI fallback 1 |
| `OPENROUTER_API_KEY` | Optional | AI fallback 2 |
| `CELERY_ALWAYS_EAGER` | Auto-set | `true` on free tier (no Redis) |
| `SECURE_SSL_REDIRECT` | Auto-set | `false` (Render handles TLS) |
| `EMAIL_HOST_USER` | Optional | SMTP user for real email delivery |
| `EMAIL_HOST_PASSWORD` | Optional | SMTP password |
| `REQUIRE_EMAIL_VERIFICATION` | Optional | Defaults to `false` |
| `DJANGO_SETTINGS_MODULE` | Auto-set | `config.settings.production` |

### Vercel (Frontend)
| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ Yes | Your Render backend origin (no trailing slash) |

---

## Render Service Settings Summary

| Setting | Value |
|---|---|
| Runtime | Python |
| Region | Oregon |
| Plan | Free |
| Build command | `bash build.sh` |
| Start command | `bash backend/run_prod.sh` |
| Health check path | `/api/v1/live/` |

## Vercel Project Settings Summary

| Setting | Value |
|---|---|
| Root directory | `frontend` |
| Framework preset | Vite |
| Build command | `cd .. && pnpm install --no-frozen-lockfile && pnpm --filter @workspace/brainpilot-web run build` |
| Output directory | `dist/public` |
| Environment variable | `VITE_API_URL=https://brainpilot-api.onrender.com` |

## Neon Settings Summary

| Setting | Value |
|---|---|
| Plan | Free |
| Region | US East (match Render region) |
| Database name | `brainpilot` |
| Connection variable | `DATABASE_URL` (use the **pooled** connection string) |

---

## Troubleshooting

**`DisallowedHost` error on Render**
: Render auto-sets `RENDER_EXTERNAL_HOSTNAME` — `production.py` reads it automatically. If you use a custom domain, add it to `ALLOWED_HOSTS`.

**CORS errors in the browser**
: Make sure `CORS_ALLOWED_ORIGINS` on Render exactly matches your Vercel URL (no trailing slash).

**`403 CSRF verification failed`**
: Add both your Vercel URL and Render URL to `CSRF_TRUSTED_ORIGINS`.

**Free tier cold start (30 s delay)**
: This is expected. Render spins down free services after 15 min of inactivity. Upgrade to the Starter plan ($7/mo) to keep it always-on.

**Neon SSL error**
: Ensure your `DATABASE_URL` ends with `?sslmode=require`. Neon requires SSL.

**Migrations didn't run**
: `run_prod.sh` runs `python manage.py migrate --noinput` before starting Gunicorn. Check the **Render Deploy Logs** for migration output.
