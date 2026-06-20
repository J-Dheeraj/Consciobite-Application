---
type: entity
title: "Transparency Page"
created: 2026-06-20
status: stable
tags: [entity, frontend, governance, transparency]
---

# Transparency Page

**File:** `frontend/src/app/transparency/page.js` (+ `layout.js`)
**Route:** `/transparency`
**Added:** commit `b6063fd` (2026-05-29), Session 3 of the governance brief

Public-facing page addressing the manufacturer-pays-for-grading conflict of interest. Linked from `Navbar` and `Footer`.

---

## Sections

1. **The Independence Problem** — states the conflict directly (fee-for-listing vs. claimed objectivity)
2. **Advisory Panel** (`GOVERNANCE_CONFIG.panelSeats`) — 3 seats (Academic, Regulatory, Industry/Non-Client), each currently `confirmed: false` — no real candidates yet
3. **Commitments** — 5 published statements, e.g. "Listing fees are non-contingent on GreenGrade score outcome"
4. **Methodology** — version badge (`v3.0`), next review date (`2026-12-01`), links to `/methodology`
5. **Score Change Statistics (Last 12 Months)** — live data via `fetchTransparencyStats()` (`frontend/src/services/admin.js`) hitting `GET /api/transparency/stats`
6. **Annual Review Statement** — placeholder text until the first review (`2026-12-01`)
7. **Contact** — `governance@consciobite.com`

## Backend dependency

`GET /api/transparency/stats` is mounted directly in `backend/src/index.js:194`, wrapped in `cacheMiddleware(300)` (5-minute in-memory cache, no auth — public stats only, no product/manufacturer names disclosed).

## Things to watch

- `GOVERNANCE_CONFIG` is hardcoded in the page component. If panel seats get confirmed (real names), this becomes a content update, not a data-driven one — no CMS or DB-backed config exists for it yet.
- `nextReviewDate: "2026-12-01"` is a hardcoded string with no expiry/reminder mechanism.

## Links

- [[Grading Independence Governance]] — business context and full action plan
- [[Admin Routes]] — `/api/admin/conflict-log` is the authenticated counterpart to this public page
- [[GreenGrade Governance Charter 2026-05-29]] — defines what these panel seats actually mean
