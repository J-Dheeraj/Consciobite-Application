---
type: concept
title: "Render Deployment"
created: 2026-05-13
updated: 2026-05-13
status: developing
tags: [render, deployment, infrastructure]
related: ["[[Static Export Pipeline]]", "[[Docker Build Context]]", "[[System Overview]]"]
---

# Render Deployment

Consciobite deploys to Render.com as two services defined in `render.yaml`.

## Services

### Backend (`consciobite-api`)
- **Type:** `web` (Node.js runtime)
- **Build:** `npm ci`
- **Start:** `npm start`
- **Health check:** `GET /api/health`
- **Plan:** free

### Frontend (`consciobite-app`)
- **Type:** `static`
- **Build:** `npm ci && npm run build`
- **Publish path:** `build/`
- **Routing:** All paths rewrite to `/index.html` (SPA fallback)

## API Base Detection

Since static export cannot use `next.config.js` rewrites for API proxying, the frontend detects the API base URL at runtime via `getApiBase()` in `httpClient.js`:

```javascript
function getApiBase() {
  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    if (hostname.endsWith(".onrender.com")) {
      const apiHost = hostname.replace("-app", "-api");
      return `${protocol}//${apiHost}/api`;
    }
  }
  return "/api";
}
```

This converts `consciobite-app.onrender.com` -> `consciobite-api.onrender.com` automatically.

## Blueprint Gotcha

Render Blueprint sync (`render.yaml`) does NOT auto-migrate manually-created services when you change their `type` (e.g., `static` -> `node`). If a service was created manually on Render's dashboard, the blueprint only updates configuration within the same service type. To change service type, you must delete and recreate the service.

## Environment Variables

- `NEXT_PUBLIC_API_URL` — Set via `fromService` in render.yaml, resolves to the backend's hostname
- `JWT_SECRET` — Auto-generated for backend
- `ALLOWED_ORIGINS` — Set to frontend's URL for CORS

## Cold Start (free tier)

The backend free-tier instance spins down on idle and takes 30-60s to respond to the first request after a gap. [[ApiReadyGate Component]] (added 2026-06-07) wraps the frontend app tree and polls `/api/health` before rendering real content, so the first post-idle visit shows a spinner instead of failed API calls.

## Routing fix (2026-06-05)

`trailingSlash: true` was added to `next.config.js`. Without it, static export produced flat files (e.g. `transparency.html`) that neither Render's static hosting nor nginx resolve for a bare `/transparency` request — both only look for `route/index.html`. `nginx.conf`'s catch-all rewrite now serves `404.html` instead of `index.html` for unknown routes.
