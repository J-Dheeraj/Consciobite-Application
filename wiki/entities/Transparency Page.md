---
type: entity
title: "Transparency Page"
created: 2026-05-28
status: active
tags: [frontend, governance, transparency, public]
---

# Transparency Page

Public governance and transparency page at `/transparency`.

---

## Location

`frontend/src/app/transparency/page.js`

## Purpose

Demonstrates GreenGrade scoring independence to investors, regulators, and retail partners by publishing:
1. Advisory board status and seat descriptions
2. Aggregate scoring statistics (paying vs. non-paying client deltas)
3. Governance commitments

## Data Source

Fetches from `GET /api/transparency` (no auth required). Returns:

```json
{
  "lastAuditDate": "2026-05-21",
  "algorithmVersion": "...",
  "advisoryBoard": { "status": "formation", "seats": [...] },
  "scoringStats": {
    "totalProducts": 550,
    "listedManufacturers": 0,
    "totalScoreChanges": 0,
    "paying": { "changes": 0, "avgDelta": 0, "increases": 0, "decreases": 0 },
    "nonPaying": { "changes": 0, "avgDelta": 0, "increases": 0, "decreases": 0 }
  },
  "commitments": [...]
}
```

## Frontend Service

`frontend/src/services/governance.js` — `fetchTransparency()`.
Re-exported from `frontend/src/services/api.js`.

## Sections

| Section | Description |
|---------|-------------|
| Hero | Title, algorithm version badge, last audit date |
| Advisory Board | 3 board seats (Academic, Regulator, Industry) with status |
| Scoring Stats | Total products, changes, paying/non-paying delta comparison |
| Delta gap indicator | |abs(paying avgDelta − nonPaying avgDelta)| — zero = no bias |
| Commitments | 5 published governance commitments |
| Methodology link | CTA linking to `/methodology` |

## Links

- [[Grading Independence Governance]] — domain page
- [[Score Audit Service]] — provides `getPublicStats()`
- [[Admin Routes]] — admin-only detailed conflict log
