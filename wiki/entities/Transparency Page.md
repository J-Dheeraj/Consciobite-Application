---
type: entity
title: "Transparency Page"
created: 2026-06-21
status: developing
tags: [entity, governance, frontend, transparency]
---

# Transparency Page

**File:** `frontend/src/app/transparency/page.js` (+ `layout.js` for metadata)
**Route:** `/transparency` — public, no auth required
**Shipped:** PR #31 (`feat: add governance frontend`), 2026-05-29

Public-facing page that addresses the manufacturer-pays-for-grading conflict of interest directly. Linked from the Navbar and Footer.

---

## Sections

1. **The Independence Problem** — states the conflict plainly instead of hiding it
2. **Advisory Panel** — renders `GOVERNANCE_CONFIG.panelSeats` (Academic, Regulatory, Industry-non-client); each seat shows a "Confirmed" / "In Formation" badge. All 3 are currently "In Formation" — no founding members confirmed yet.
3. **Our Commitments** — 5 bullet commitments (listing fees non-contingent on score, Panel can request rescoring anytime, all paying-client score changes logged, annual review published here, no Panel member may represent a paying client)
4. **Methodology** — short summary + link to `/methodology`
5. **Score Change Statistics (Last 12 Months)** — live data via React Query (`fetchTransparencyStats` from `frontend/src/services/admin.js`) hitting `GET /api/transparency/stats`
6. **Annual Review Statement** — placeholder text; first review targeted for `GOVERNANCE_CONFIG.nextReviewDate` (2026-12-01)
7. **Contact** — `governance@consciobite.com`

## Backend dependency

`GET /api/transparency/stats` (`backend/src/index.js`, public route, cached 300s via `cacheMiddleware`) calls `getConflictStats()` from [[Score Audit Service]] and returns paying vs. non-paying score-change aggregates. No product or manufacturer names are exposed — only counts and average deltas.

## Key Design Decisions

- `GOVERNANCE_CONFIG` is a hardcoded object in the page component, not fetched from an API — panel seat data is static content until real members are confirmed
- Page is intentionally honest about the conflict rather than glossing over it, per the original investor feedback

## Links

- [[Grading Independence Governance]] — business context this page exists to address
- [[Score Audit Service]] — source of the live statistics
- [[Admin Routes]] — admin-only counterpart (`/api/admin/conflict-log`) with full detail vs. this page's public aggregates
- [[GreenGrade Governance Charter 2026-05-29]] — the charter this page summarizes
