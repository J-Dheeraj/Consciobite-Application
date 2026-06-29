---
type: entity
title: "Digital Product Passport API"
created: 2026-06-29
status: stable
tags: [entity, b2b, passport, routes, esg]
---

# Digital Product Passport API

**File:** `backend/src/routes/passport.js`
**Mounted at:** `/api/v1/*` (no `/api/passport` alias — v1-only)
**Audience:** B2B integrators — EU ESPR (Ecodesign for Sustainable Products Regulation) and SGX Scope 3 supply-chain reporting.

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/passport/:productId` | Single-product passport: GreenGrade score, percentile, full 7-dimension emission breakdown, total CO2e, data confidence tier |
| `POST` | `/api/v1/portfolio/score` | Batch passport for 1-100 product IDs + portfolio summary (average score, highest/lowest, per-category benchmarks) |
| `GET` | `/api/v1/audit/:productId` | Paginated score-change history for a product, backed by `score_change_logs` (same table [[Score Audit Service]] writes to) |

All three are public (no auth) and rate-limited like the rest of `/api/`. `getMethodology()` (`/api/methodology`) and `METHODOLOGY.md` (repo root) document the `methodology_version: "3.0"` field returned on every passport.

## Input handling

- Product IDs are sanitized (`validator.escape` + `trim`, capped at 20 chars) then required to be alphanumeric — invalid IDs return 400, not 500.
- `portfolio/score` validates `product_ids` is an array of 1-100 strings via `validate()` + manual array checks; unknown IDs inside a valid batch are silently skipped, not 404'd (only an empty result set 404s).
- `audit/:productId` limit/offset use the `pattern: /^\d+$/` convention from [[Validate Middleware Pattern]], capped at 500.

## Tests

`backend/__tests__/passport.test.js` — added 2026-06-29 to close a gap where these routes shipped (PR #33, `8d7ead3`) without Supertest coverage, violating the CLAUDE.md convention that every route needs at least one integration test.

## Links

- [[Score Audit Service]] — `score_change_logs` table the audit endpoint reads
- [[GreenGrade Service]] — `calculateGreenGrade()` used to build each passport
- [[Validate Middleware Pattern]] — query param validation pattern
- [[Grading Independence Governance]] — business context for why audit trail is exposed externally
