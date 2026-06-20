---
type: entity
title: "Digital Product Passport API"
created: 2026-06-20
status: developing
tags: [entity, api, b2b, passport, esg]
---

# Digital Product Passport API

**File:** `backend/src/routes/passport.js`
**Mounted at:** `/api/v1/*` (per Swagger docs in `backend/src/swagger.js`)
**Shipped:** PR #33, commit `8d7ead3` (2026-06-07)

B2B-facing endpoints that expose GreenGrade scoring in a machine-readable
format for corporate ESG reporting — built to target EU ESPR (Ecodesign for
Sustainable Products Regulation) and SGX Scope 3 disclosure use cases.

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/v1/passport/:productId` | Single-product passport: GreenGrade score, percentile, full 7-category emission breakdown, data confidence tier |
| `POST` | `/v1/portfolio/score` | Batch passport for up to 100 product IDs; returns per-product passports + portfolio summary (avg score, highest/lowest, per-category benchmarks) |
| `GET` | `/v1/audit/:productId` | Paginated score-change history for a product, backed by `score_change_logs` (same table [[Score Audit Service]] writes to) |

## Notable implementation details

- `buildPassport()` reuses `calculateGreenGrade()` from [[GreenGrade Service]] — no parallel scoring logic.
- Product ID input is sanitized with `validator.escape/trim` then checked with `validator.isAlphanumeric` before lookup — defends against injection via the `:productId` path param even though products are looked up in the static `products.json` array, not SQL.
- `/portfolio/score` validates `product_ids` is an array of 1–100 strings before processing; invalid/unknown IDs are silently skipped rather than erroring the whole batch.
- `/audit/:productId` reads directly from SQLite (`getDb()`), not the JSON catalog, since audit logs aren't part of the static product data.
- `methodology_version: "3.0"` is hardcoded in each passport response — corresponds to `METHODOLOGY.md` at repo root.

## Links

- [[GreenGrade Service]] — scoring logic the passport wraps
- [[Score Audit Service]] — source of the `/v1/audit/:productId` data
- [[validate() Middleware]] — used for `/portfolio/score` and the audit query params
