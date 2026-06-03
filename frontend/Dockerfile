# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /workspace

# Copy workspace manifests first for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/db/package.json ./lib/db/
COPY frontend/package.json ./frontend/
COPY scripts/package.json ./scripts/

RUN pnpm install --frozen-lockfile

# Copy source
COPY lib/ ./lib/
COPY frontend/ ./frontend/
COPY scripts/ ./scripts/
COPY tsconfig.base.json tsconfig.json ./

# Production build — PORT and BASE_PATH default to 5000 and / if not provided
ARG NODE_ENV=production
ARG BASE_PATH=/
ENV NODE_ENV=$NODE_ENV
ENV BASE_PATH=$BASE_PATH

RUN pnpm --filter @workspace/brainpilot-web run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /workspace/frontend/dist/public /usr/share/nginx/html

# Non-root user
RUN addgroup -g 101 -S nginx-app && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx-app -g nginx-app nginx-app

RUN chown -R nginx-app:nginx-app /usr/share/nginx/html && \
    chown -R nginx-app:nginx-app /var/cache/nginx && \
    chown -R nginx-app:nginx-app /var/log/nginx && \
    touch /var/run/nginx.pid && chown nginx-app:nginx-app /var/run/nginx.pid

USER nginx-app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
