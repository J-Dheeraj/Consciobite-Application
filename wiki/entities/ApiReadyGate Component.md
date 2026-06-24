---
type: entity
title: "ApiReadyGate Component"
created: 2026-06-24
status: stable
tags: [entity, frontend, ux]
---

# ApiReadyGate Component

`frontend/src/components/ApiReadyGate.js` — cold-start UX wrapper added in PR #33. Render's free-tier backend spins down when idle and takes 30-60s to wake on the next request; this component polls `GET /health` every 3s (`POLL_INTERVAL`) for up to 60s (`MAX_WAIT`) and shows a "Waking up the server..." spinner instead of letting child components hit a confusing loading/error state during cold start.

Wired into `frontend/src/components/Providers.js`, wrapping the app at the provider level so it applies globally rather than per-page.

Falls open after `MAX_WAIT` (sets `ready` true regardless) — avoids a permanent spinner if `/health` is unreachable for reasons other than cold start.

## Links

- [[Render Deployment]] — why the cold-start problem exists (free-tier instance)
