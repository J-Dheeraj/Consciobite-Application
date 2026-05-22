---
type: entity
title: "Transparency Page"
created: 2026-05-22
status: done
tags: [entity, governance, frontend, transparency]
---

# Transparency Page

**Route:** `/transparency`
**File:** `frontend/src/app/transparency/page.js`
**API:** `GET /api/transparency` (public, no auth)
**Service fn:** `fetchTransparency()` in `frontend/src/services/recipes.js`

---

## Purpose

Public-facing governance disclosure page. Addresses the investor conflict-of-interest concern by making aggregate audit statistics and governance commitments visible to all users, regulators, and retail partners.

## Sections

| Section | Content |
|---------|---------|
| Hero | Independence statement, algorithm version badge, board status badge |
| Score Audit — Last 12 Months | Stat boxes: total changes, paying client count, non-paying count; avg delta per group; increase/decrease breakdown |
| Advisory Board | 3 board seats (Academic, Regulator, Industry) — all currently open; board mandate list |
| Governance Principles | 4 principles: Score Independence, Audit Trail, Transparent Methodology, Data Provenance |
| Links | CTA to `/methodology` and `/products` |

## Backend Endpoint

`GET /api/transparency` in `backend/src/index.js`. Returns:
```json
{
  "statement": "...",
  "algorithmVersion": "3.0",
  "governance": {
    "advisoryBoard": { "status": "forming", "seats": [...], "mandate": [...] },
    "principles": [...]
  },
  "auditStats": { "totalChanges": 0, "paying": {...}, "nonPaying": {...} },
  "lastUpdated": "..."
}
```

Calls `getConflictStats()` from `scoreAudit.js` for the stats. No authentication required.

## Links

- [[Grading Independence Governance]] — business context and action plan
- [[Score Audit Service]] — `getConflictStats()` providing the audit data
- [[Admin Routes]] — admin-only detailed log (complement to this public page)
