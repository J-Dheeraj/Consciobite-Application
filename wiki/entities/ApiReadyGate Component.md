---
type: entity
title: "ApiReadyGate Component"
created: 2026-06-26
status: mature
tags: [frontend, component, cold-start, render]
---

# ApiReadyGate Component

**File:** `frontend/src/components/ApiReadyGate.js`
**Added:** 2026-06-07, commit `8d7ead3` — wired into `frontend/src/components/Providers.js`

Wraps the app tree and polls `GET ${API_BASE}/health` every 3s (`POLL_INTERVAL`) until the backend responds OK, showing a "Waking up the server..." spinner in the meantime. Gives up and renders children anyway after 60s (`MAX_WAIT`) so a slow-but-alive backend doesn't hard-block the UI forever.

## Why it exists

The Render free-tier backend spins down on idle and takes 30-60s to cold-start on the next request. Without this gate, the first real page load after idle would hit failed API calls and render error states instead of a loading state.

## Notes

- Uses raw `fetch` (not `httpClient.js`/React Query) — intentional, since this is a pre-flight liveness probe, not application data fetching. Per `CLAUDE.md` convention ("API calls go through `src/services/` modules only — never `fetch()` directly in a component"), this is the one sanctioned exception: it's checking server liveness, not consuming an API endpoint.
- `cache: "no-store"` to avoid the browser caching the health check.

## Links

- [[Render Deployment]] — free-tier cold start context
