---
type: concept
title: "Cold Start UX"
created: 2026-06-18
status: mature
tags: [frontend, ux, render, free-tier]
related: ["[[Render Deployment]]"]
---

# Cold Start UX

**File:** `frontend/src/components/ApiReadyGate.js`
**Landed:** PR #33, 2026-06-08

Render's free tier spins down the backend web service after idle, so the first request after idle can take 30–60s to wake it. Before this, the first page load would hit fetch failures or hang silently. `ApiReadyGate` wraps the app (mounted in `frontend/src/components/Providers.js`) and:

1. Polls `${API_BASE}/health` every 3s (`POLL_INTERVAL`).
2. Renders a "Waking up the server..." spinner with an explanatory line about the free-tier cold start, instead of children, until the health check succeeds.
3. Gives up and renders children anyway after 60s (`MAX_WAIT`), so a transient health-check failure can't wedge the UI indefinitely.

Pure client-side polling component — no React Query involved since it's gating app mount, not server state.
