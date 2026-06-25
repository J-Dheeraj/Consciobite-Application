---
type: entity
title: "ApiReadyGate Component"
created: 2026-06-25
status: developing
tags: [entity, frontend, cold-start, render]
---

# ApiReadyGate Component

**File:** `frontend/src/components/ApiReadyGate.js`
**Wired in:** `frontend/src/components/Providers.js`
**Landed:** PR #33 (`8d7ead3`), merged 2026-06-07

---

## Purpose

Render.com's free-tier web service spins down on idle and takes tens of seconds to cold-start. Without this gate, the first page load after idle would hit `ECONNREFUSED`/timeout errors against the backend before it's actually up.

## Behavior

- Polls `GET ${API_BASE}/health` every 3s (`POLL_INTERVAL`).
- Shows a centered spinner + message in place of `children` until the backend responds `ok`.
- Gives up waiting after 60s (`MAX_WAIT`) and renders `children` anyway — fails open so a permanently-down backend doesn't permanently blank the UI; subsequent API calls in `children` will surface their own errors normally.
- Client component (`"use client"`), no React Query involved — this is a one-shot readiness check, not server state.

## Related

- [[Digital Product Passport API]] — landed in the same PR.
- `frontend/src/services/httpClient.js` — source of `API_BASE`.
