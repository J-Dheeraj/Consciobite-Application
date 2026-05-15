---
type: concept
title: "Docker Build Context"
created: 2026-05-13
updated: 2026-05-13
status: developing
tags: [docker, build, deployment]
related: ["[[Static Export Pipeline]]", "[[Render Deployment]]", "[[System Overview]]"]
---

# Docker Build Context

The frontend Docker image requires access to `backend/src/data/products.json` at build time for `generateStaticParams()`. This creates a cross-directory dependency that affects how Docker build context is configured.

## Problem

`generateStaticParams()` computes the products.json path as:
```javascript
join(process.cwd(), "..", "backend", "src", "data", "products.json")
// WORKDIR=/app -> resolves to /backend/src/data/products.json
```

If `docker-compose.yml` sets `context: ./frontend`, the backend directory is outside the build context and Docker cannot COPY it into the image. The try/catch returns `[]`, but this means zero product pages are pre-rendered.

## Solution

**docker-compose.yml** uses the repo root as build context:
```yaml
frontend:
  build:
    context: .
    dockerfile: frontend/Dockerfile
    args:
      NEXT_PUBLIC_API_URL: http://localhost:4000
```

**Dockerfile** COPY commands use `frontend/` prefix and explicitly copy products.json:
```dockerfile
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/jsconfig.json ./
COPY frontend/next.config.js ./
COPY frontend/public/ ./public/
COPY frontend/src/ ./src/
COPY backend/src/data/products.json /backend/src/data/products.json
```

The products.json lands at `/backend/src/data/products.json` — exactly the path `generateStaticParams()` resolves to from WORKDIR `/app`.

## Multi-Stage Build

1. **Build stage** (node:20-alpine): Installs deps, copies source + products.json, runs `npm run build` -> produces `build/` directory
2. **Runtime stage** (nginx:alpine): Copies `build/` to nginx html root, adds nginx.conf with SPA fallback

## CI

The CI workflow (`.github/workflows/ci.yml`) runs `docker compose build` which uses the same repo-root context. The `JWT_SECRET` env var is provided as `ci-build-test-secret` for the build check.
