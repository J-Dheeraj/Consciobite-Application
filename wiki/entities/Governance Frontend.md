---
type: entity
title: "Governance Frontend"
created: 2026-06-24
status: developing
tags: [entity, admin, governance, frontend, transparency]
---

# Governance Frontend

Frontend surfaces for the governance layer (landed `b6063fd`, never previously logged in the wiki). Three pages plus one new public backend endpoint.

---

## Pages

| Path | Audience | Purpose |
|------|----------|---------|
| `frontend/src/app/admin/conflict-log/page.js` | Admin only | Summary stats, paying/non-paying filter, rescore button, full `score_change_logs` table |
| `frontend/src/app/admin/manufacturers/page.js` | Admin only | Create manufacturer (with paying-client + fee-acknowledgement checkbox), link product↔manufacturer, list registered manufacturers |
| `frontend/src/app/transparency/page.js` | Public | `GOVERNANCE_CONFIG` (panel seats, commitments, methodology version/next-review-date), live score-change stats via React Query, link to `/methodology` |

All three call through `frontend/src/services/admin.js` — no raw `fetch()` in the components, consistent with the project convention.

## New backend endpoint

`GET /api/transparency/stats` (`backend/src/index.js`, cached 300s) — public, no auth. Wraps `scoreAudit.getConflictStats()` plus `productCount`, `manufacturerCount`, `payingCount` from SQLite. This is what `transparency/page.js` renders under "Score Change Statistics."

## Status vs. governance plan

This closes **Phase 1 activation step 3** ("Publish on website at `/transparency`") from [[Grading Independence Governance]] — the page has been live since `b6063fd`, the domain page just hadn't been updated to say so. Panel seats still render `confirmed: false` / "In formation" since no founding members have been identified yet.

## Links

- [[Admin Routes]] — backend routes these pages call
- [[Score Audit Service]] — source of the stats
- [[Grading Independence Governance]] — business context
