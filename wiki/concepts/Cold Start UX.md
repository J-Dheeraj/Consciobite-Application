---
type: concept
title: "Cold Start UX"
created: 2026-06-25
status: mature
tags: [concept, frontend, render, ux]
related: ["[[Render Deployment]]"]
sources: ["commit 8d7ead3"]
---

# Cold Start UX

**File:** `frontend/src/components/ApiReadyGate.js`, wired in `frontend/src/components/Providers.js`

Render's free-tier backend spins down when idle and takes 30–60s to wake on the next request. Before this component, the first page load after idle would hit failed API calls with no explanation.

## Behavior

- Polls `${API_BASE}/health` every 3s (`POLL_INTERVAL`) for up to 60s (`MAX_WAIT`).
- Renders children (the real app) immediately once `/health` returns `res.ok`.
- Gives up and renders children anyway after `MAX_WAIT`, so a permanently-down backend doesn't trap users on the loading screen forever — the app still mounts and individual requests fail normally.
- Shows a spinner + "Waking up the server..." copy while waiting, using inline styles with the existing CSS custom properties (`--text-primary`, `--text-secondary`) — consistent with the project's no-framework styling convention.

## Why not a loading state per-page

Wrapping at the `Providers.js` level (root) means every route benefits without each page needing its own cold-start handling — the gate resolves once per session load, not per navigation.
