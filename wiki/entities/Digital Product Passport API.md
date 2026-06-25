---
type: entity
title: "Digital Product Passport API"
created: 2026-06-25
status: developing
tags: [entity, b2b, passport, api, governance]
---

# Digital Product Passport API

**File:** `backend/src/routes/passport.js`
**Mounted at:** `/api/v1/*` (see `backend/src/index.js`)
**Landed:** PR #33 (`8d7ead3`), merged 2026-06-07

---

## Purpose

B2B-facing endpoints exposing GreenGrade scores in a structured "digital product passport" format, aimed at EU ESPR (Ecodesign for Sustainable Products Regulation) and SGX Scope 3 supply-chain reporting use cases.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/passport/:productId` | Full passport: score, percentile, 7-category emission breakdown, data confidence tier |
| `POST` | `/api/v1/portfolio/score` | Batch scoring for a list of product IDs (portfolio-level reporting) |
| `GET` | `/api/v1/audit/:productId` | Audit trail for a single product's score history |

## Implementation notes

- Reuses `calculateGreenGrade()` from `backend/src/services/greengrade.js` — no separate scoring path.
- Input sanitization via `validator` (`sanitize()` helper escapes + trims + length-caps) rather than the standard `validate()` middleware schema pattern used elsewhere — worth normalizing if this surface grows.
- Passport payload includes `methodology_version: "3.0"`, tying responses to [[GreenGrade KDE Scoring]] and the new `METHODOLOGY.md` spec at repo root.
- Swagger docs updated in `backend/src/swagger.js` for all three routes.

## Related

- `METHODOLOGY.md` (repo root) — full GreenGrade v3.0 technical spec backing the passport's `methodology_version` field.
- [[ApiReadyGate Component]] — shipped in the same PR, addresses Render free-tier cold starts for the frontend consuming this and other API surfaces.
- [[Score Audit Service]] — backs the `/audit/:productId` endpoint's history data.
