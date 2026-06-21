---
type: entity
title: "ApiReadyGate Component"
created: 2026-06-21
status: stable
tags: [entity, frontend, ux]
---

# ApiReadyGate Component

**File:** `frontend/src/components/ApiReadyGate.js`
**Added:** 2026-06-07, commit `8d7ead3`
**Wired in:** `frontend/src/components/Providers.js`

Client component that masks Render free-tier backend cold starts. Polls `${API_BASE}/health` every 3s (`POLL_INTERVAL`) until it gets a 200, or until 60s (`MAX_WAIT`) elapses, then renders `children` either way. Shows a spinner + "Waking up the server..." message while waiting.

## Notes

- Fails open: if the backend never responds within `MAX_WAIT`, the gate renders children anyway rather than blocking the app indefinitely.
- No test coverage added (frontend component, not a backend route — outside the "every new route needs a Supertest test" rule, but CLAUDE.md also asks for "at least a render smoke test" on new frontend components). Not added in this session; flagged for a future pass if frontend test conventions are being enforced more strictly.

## Links

- [[Digital Product Passport API]] — shipped in the same commit, unrelated functionally
- [[Render Deployment]] — why cold starts happen (free tier)
