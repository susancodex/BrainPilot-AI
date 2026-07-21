# BrainPilot AI - Deployment Guide

This guide covers deploying BrainPilot AI to free hosting platforms. The application is split into:
- **Frontend:** React + Vite (deployed to Vercel)
- **Backend:** Django + DRF (deployed to Render)
- **Database:** PostgreSQL (Neon - free tier)
- **Cache/Queue:** Redis (Upstash - free tier)

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Free Hosting Setup](#free-hosting-setup)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Environment Variables](#environment-variables)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Local Deployment with Docker](#local-deployment-with-docker)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- GitHub account (for version control)
- Vercel account (for frontend)
- Render account (for backend)
- Neon account (for PostgreSQL database)
- Upstash account (for Redis cache/queue)

All these platforms have generous free tiers suitable for this application.

---

## Free Hosting Setup

### Platform Overview

| Service | Platform | Free Tier | Purpose |
|---------|----------|-----------|---------|
| Frontend | Vercel | Unlimited deployments | React application |
| Backend | Render | 750 hours/month | Django REST API |
| Database | Neon | 0.5GB storage | PostgreSQL |
| Redis | Upstash | 10K commands/day | Celery cache/queue |

**Total Cost:** $0/month

---

## Step-by-Step Deployment

### Step 1: Prepare Your Code

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/brainpilot-ai.git
   git push -u origin main
   ```

### Step 2: Set Up Neon PostgreSQL (Database)

1. Go to [Neon Console](https://console.neon.tech/)
2. Sign up and create a new project
3. Copy the connection string (format: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/brainpilot?sslmode=require`)
4. Save this for later use in Render

### Step 3: Set Up Upstash Redis (Cache/Queue)

1. Go to [Upstash Console](https://console.upstash.com/)
2. Sign up and create a new Redis database
3. Copy the REST API URL (format: `https://xxx.upstash.io`)
4. Save this for later use in Render

### Step 4: Deploy Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Select the `render.yaml` file in the root directory
5. Configure the following environment variables:

   **Required:**
   - `DJANGO_SECRET_KEY`: Generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`
   - `DATABASE_URL`: Your Neon connection string from Step 2
   - `REDIS_URL`: Your Upstash Redis URL from Step 3
   - `GEMINI_API_KEY`: Get from [Google AI Studio](https://aistudio.google.com/app/apikey)

   **Optional (for email):**
   - `EMAIL_HOST_USER`: Your Gmail address
   - `EMAIL_HOST_PASSWORD`: Your Gmail app password

6. Click "Apply" to deploy

7. **Important:** After the backend deploys, copy the backend URL (e.g., `https://brainpilot-api.onrender.com`)

### Step 5: Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure the following environment variables:

   - `VITE_API_URL`: Your backend URL from Step 4 (e.g., `https://brainpilot-api.onrender.com/api/v1`)

5. Click "Deploy"

6. **Important:** After the frontend deploys, copy the frontend URL (e.g., `https://brainpilot.vercel.app`)

### Step 6: Update CORS Settings

1. Go back to Render Dashboard
2. Open your brainpilot-api service
3. Go to "Environment" section
4. Update these variables with your Vercel URL:
   - `CORS_ALLOWED_ORIGINS`: `https://brainpilot.vercel.app`
   - `CSRF_TRUSTED_ORIGINS`: `https://brainpilot.vercel.app`
   - `FRONTEND_URL`: `https://brainpilot.vercel.app`
5. Click "Save Changes" to redeploy

---

## Environment Variables

### Backend (Render)

```bash
# Django Core
DJANGO_SETTINGS_MODULE=config.settings.production
DJANGO_SECRET_KEY=your-secret-key-here

# Database
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/brainpilot?sslmode=require

# Redis
REDIS_URL=https://xxx.upstash.io

# AI Providers (at least one required)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
GROQ_API_KEY=your-groq-api-key  # optional
OPENROUTER_API_KEY=your-openrouter-api-key  # optional

# CORS/CSRF (set to your Vercel URL)
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
CSRF_TRUSTED_ORIGINS=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@brainpilot.ai

# Security
SECURE_SSL_REDIRECT=false
REQUIRE_EMAIL_VERIFICATION=false
```

### Frontend (Vercel)

```bash
VITE_API_URL=https://your-backend.onrender.com/api/v1
```

---

## Post-Deployment Configuration

### 1. Create Superuser

After backend deployment, create an admin user:

```bash
# In Render Dashboard → brainpilot-api → Shell
python manage.py createsuperuser
```

### 2. Configure Email (Optional)

For email verification and password reset:

1. Enable 2FA on your Google account
2. Generate an app password: Google Account → Security → App Passwords
3. Set `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` in Render
4. Set `REQUIRE_EMAIL_VERIFICATION=true` in Render

### 3. Monitor Logs

- **Render:** Dashboard → brainpilot-api → Logs
- **Vercel:** Dashboard → brainpilot → Deployments → View Logs

---

## Local Deployment with Docker

### Using Docker Compose

1. Create `.env` file in root:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

2. Run with Docker Compose:
   ```bash
   docker-compose up -d
   ```

3. Access:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000
   - Admin: http://localhost:8000/admin

### Manual Local Setup

See [README.md](README.md) for detailed local development instructions.

---

## Troubleshooting

### Backend Issues

**Issue: 502 Bad Gateway**
- Check Render logs for startup errors
- Ensure all required environment variables are set
- Verify DATABASE_URL and REDIS_URL are correct

**Issue: CORS errors**
- Ensure CORS_ALLOWED_ORIGINS matches your Vercel URL exactly
- Check that the URL includes https:// and no trailing slash

**Issue: Database connection failed**
- Verify DATABASE_URL format
- Ensure Neon database is active
- Check that sslmode=require is in the connection string

### Frontend Issues

**Issue: API calls failing**
- Check that VITE_API_URL is set correctly
- Verify backend is accessible
- Check browser console for specific errors

**Issue: Build fails**
- Ensure all dependencies are in package.json
- Check Vercel build logs for specific errors

### AI Features Not Working

**Issue: AI features return errors**
- Verify GEMINI_API_KEY is set and valid
- Check that the API key has sufficient quota
- Review Render logs for AI-related errors

---

## Alternative: Railway Deployment

As an alternative to Render, you can deploy to Railway:

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Add services:
   ```bash
   railway add postgresql
   railway add redis
   railway add --service backend
   railway add --service frontend
   ```
5. Deploy: `railway up`

---

## Scaling Beyond Free Tier

When you need to scale beyond free limits:

1. **Render:** Upgrade to Starter ($7/month) for more CPU and memory
2. **Neon:** Upgrade to paid plans for more storage
3. **Upstash:** Upgrade for higher Redis limits
4. **Vercel:** Pro plan ($20/month) for more bandwidth and analytics

---

## Support

For issues or questions:
- Check the [GitHub Issues](https://github.com/YOUR_USERNAME/brainpilot-ai/issues)
- Review platform-specific documentation:
  - [Render Docs](https://render.com/docs)
  - [Vercel Docs](https://vercel.com/docs)
  - [Neon Docs](https://neon.tech/docs)
  - [Upstash Docs](https://upstash.com/docs)
