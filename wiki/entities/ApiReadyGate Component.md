---
type: entity
title: "ApiReadyGate Component"
created: 2026-06-20
status: developing
tags: [entity, frontend, ux, render-free-tier]
---

# ApiReadyGate Component

**File:** `frontend/src/components/ApiReadyGate.js`
**Wraps:** app root via `frontend/src/components/Providers.js`
**Shipped:** PR #33, commit `8d7ead3` (2026-06-07)

Cold-start loading gate for Render's free-tier backend, which spins down
after inactivity and takes 30-60s to wake on the next request.

## Behavior

- Polls `${API_BASE}/health` every 3s (`POLL_INTERVAL`) until it gets a 2xx.
- Gives up and renders children anyway after 60s (`MAX_WAIT`), so a genuinely
  down backend doesn't trap users on the spinner forever.
- Shows a spinner + "Waking up the server..." message while polling.
- Client component (`"use client"`) — safe inside the static-export app
  since it only runs in the browser after hydration.

## Links

- [[Render Deployment]] — why the backend cold-starts in the first place
- [[Static Export Pipeline]] — why this has to be a client component, not SSR
