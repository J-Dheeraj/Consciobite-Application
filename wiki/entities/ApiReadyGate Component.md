---
type: entity
title: "ApiReadyGate Component"
created: 2026-06-16
status: developing
tags: [entity, frontend, ux, render]
---

# ApiReadyGate Component

**File:** `frontend/src/components/ApiReadyGate.js`
**Mounted:** wraps the app inside [[Providers]]
**Purpose:** Cold-start UX for Render's free-tier backend, which spins down after inactivity and can take 30-60s to wake.

---

## Behavior

- On mount, polls `GET ${API_BASE}/health` every 3s (`POLL_INTERVAL`)
- Renders children once a 200 response comes back, or after `MAX_WAIT` (60s) elapses — whichever comes first, so a slow/unreachable API never blocks the app forever
- While waiting, shows a spinner + "Waking up the server..." message instead of a blank/broken page

## Why it exists

Without this gate, the first request after backend idle would hit the API directly from a page component, surface as a loading/error state per-component, and look like the app is broken rather than just cold-starting. Centralizing the wait at the root avoids that.

## Links

- [[Render Deployment]] — why the backend spins down in the first place
- [[Static Export Pipeline]] — frontend has no server runtime to do this check server-side
