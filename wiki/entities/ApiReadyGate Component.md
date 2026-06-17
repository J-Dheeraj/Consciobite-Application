---
type: entity
title: "ApiReadyGate Component"
created: 2026-06-17
status: stable
tags: [frontend, ux, cold-start, render]
---

# ApiReadyGate Component

`frontend/src/components/ApiReadyGate.js`, added 2026-06-07 (`8d7ead3`) and wired into
`frontend/src/components/Providers.js`. Wraps the app tree to mask Render free-tier backend cold
starts.

## Behavior

- Polls `${API_BASE}/health` every 3s (`POLL_INTERVAL`) starting on mount.
- Renders a "Waking up the server..." spinner with explanatory copy instead of `children` until
  the health check succeeds.
- Gives up and renders `children` anyway after 60s (`MAX_WAIT`), so a misbehaving health check
  can't permanently block the app.
- No retry backoff — fixed-interval polling for the whole wait window.

## Why it exists

The backend (Render web service, free tier) spins down when idle and takes 30-60s to cold-start.
Without this gate, the first API calls a user's tabs make on a cold backend would surface as
generic fetch errors. See [[Render Deployment]] for the hosting setup this compensates for.
