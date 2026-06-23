---
type: entity
title: "Digital Product Passport API"
created: 2026-06-21
status: developing
tags: [entity, backend, api, b2b, governance]
---

# Digital Product Passport API

**File:** `backend/src/routes/passport.js`
**Mounted at:** root (`/v1/passport`, `/v1/portfolio`, `/v1/audit` per `backend/src/index.js` and Swagger docs)
**Shipped:** commit `8d7ead3`, 2026-06-07 — `feat: add Digital Product Passport API, methodology docs, and cold start UX`

B2B-facing API surface aimed at manufacturers/retailers needing structured sustainability data for **EU ESPR** (Ecodesign for Sustainable Products Regulation) and **SGX Scope 3** reporting. No auth required (data is the same product-level GreenGrade info already public on the site, just machine-readable).

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/passport/:productId` | Single product passport — score, percentile, full 7-category emission breakdown, total CO2e, data confidence tier, `methodology_version` |
| `POST` | `/portfolio/score` | Batch scoring for 1–100 product IDs — returns per-product passports plus `portfolio_summary` (average score, highest/lowest) and `category_benchmarks` (per-category avg score/emissions) |
| `GET` | `/audit/:productId` | Paginated score-change history for one product, pulled straight from `score_change_logs` (same table [[Score Audit Service]] writes to) |

## Implementation notes

- `buildPassport(product)` reuses `calculateGreenGrade()` from [[GreenGrade Service]] directly — no separate scoring path, so passport data can't drift from what the app UI shows
- Product ID input is sanitized with `validator.escape/trim` then checked with `validator.isAlphanumeric` before being used in a lookup — defends against the ID being used anywhere unsafely
- `/audit/:productId` reads directly from SQLite (`getDb()`) with `validate()`-checked `limit`/`offset` query params (`pattern: /^\d+$/`, capped at 500 rows)
- `methodology_version: "3.0"` is hardcoded in `buildPassport` — bump this if the GreenGrade algorithm version changes

## Links

- [[GreenGrade Service]] — scoring function this API wraps
- [[Score Audit Service]] — source table for the `/audit/:productId` endpoint
- [[Grading Independence Governance]] — this API is cited as a concrete ESPR-alignment step under Phase 3
- [[validate() Middleware]] — query param validation pattern used for `/audit/:productId`
