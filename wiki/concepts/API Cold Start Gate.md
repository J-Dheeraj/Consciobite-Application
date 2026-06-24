---
type: concept
title: "API Cold Start Gate"
created: 2026-06-24
status: stable
tags: [concept, frontend, render, free-tier]
---

# API Cold Start Gate

**File:** `frontend/src/components/ApiReadyGate.js`
**Landed:** `8d7ead3` (2026-06-07)

Render's free-tier backend spins down on idle and takes 30-60s to wake on the next request. Without a gate, the first page load after idle hits a half-built UI (failed fetches, broken React Query states) while the API is still starting.

`ApiReadyGate` polls `GET /api/health` every 3s (`POLL_INTERVAL`) for up to 60s (`MAX_WAIT`), rendering a "Waking up the server..." spinner until the API responds `ok` — then renders `children`. If `MAX_WAIT` is exceeded it gives up and renders `children` anyway rather than blocking forever.

Wired into `frontend/src/components/Providers.js`, wrapping the app below the React Query/Theme/Auth providers — so it gates page content, not the providers themselves.

## Why this and not a loading skeleton per-page

A per-page skeleton would need to be duplicated everywhere that calls the backend on mount. Gating once at the `Providers` level means every page benefits without touching individual page components.

## Links

- [[Render Deployment]] — the free-tier hosting constraint this works around
