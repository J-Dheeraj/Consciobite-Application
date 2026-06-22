---
type: entity
title: "ApiReadyGate Component"
created: 2026-06-22
status: developing
tags: [entity, frontend, ux, render]
---

# ApiReadyGate Component

**File:** `frontend/src/components/ApiReadyGate.js`
**Wired in:** `frontend/src/components/Providers.js`, wrapping `AuthProvider` (inside `ThemeProvider`, around the whole app tree)
**Landed:** `8d7ead3` (2026-06-07)

Cold-start loading gate for the Render free-tier backend. The backend instance spins down when idle and takes 30–60s to wake on the next request, which previously showed a broken/empty app on first load.

---

## Behavior

- Polls `${API_BASE}/health` every 3s (`POLL_INTERVAL`) starting on mount.
- Renders children once a 200 response comes back, or once 60s (`MAX_WAIT`) elapses — whichever first. The `MAX_WAIT` fallback prevents the gate from blocking forever if `/health` itself is unreachable for reasons other than cold start.
- While waiting, shows a centered spinner and "Waking up the server..." copy explaining the free-tier delay.
- Client component (`"use client"`) — runs in the browser only, compatible with the static export build.

## Why it exists

Direct consequence of the B2B reframing: a 30–60s blank/broken screen is a bad first impression for an evaluator hitting the live demo link in `README.md`. This is purely a perceived-latency fix — it does not change actual cold-start time.

## Links

- [[Render Deployment]] — free-tier hosting constraint this papers over
- [[Digital Product Passport API]] — shipped in the same commit, same B2B-polish session
