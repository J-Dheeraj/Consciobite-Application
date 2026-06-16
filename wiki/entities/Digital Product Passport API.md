---
type: entity
title: "Digital Product Passport API"
created: 2026-06-16
status: developing
tags: [entity, b2b, api, passport, governance]
---

# Digital Product Passport API

**File:** `backend/src/routes/passport.js`
**Mounted at:** `/v1/*` (separate prefix from the rest of the API, which lives under `/api/*`)
**Purpose:** B2B reporting endpoints for buyers who need machine-readable GreenGrade data for compliance — EU ESPR (Ecodesign for Sustainable Products Regulation) and SGX Scope 3 disclosure were the cited use cases.

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/v1/passport/:productId` | Full GreenGrade passport for one product: score, percentile, 7-category emission breakdown, total CO2e, data confidence tier |
| `POST` | `/v1/portfolio/score` | Batch passports (1-100 product IDs) plus a portfolio summary (average score, highest/lowest, per-category benchmarks) |
| `GET` | `/v1/audit/:productId` | Paginated score-change history for one product, pulled straight from `score_change_logs` (the same table [[Score Audit Service]] writes) |

## Implementation notes

- `buildPassport()` wraps the existing `enrichProduct()` / `calculateGreenGrade()` pipeline — no new scoring logic, just a different response shape (`product_id`, `greengrade_score`, `emission_breakdown`, `methodology_version: "3.0"`, etc.)
- Product IDs are sanitized with `validator.escape/trim` then required to be alphanumeric before being looked up in `products.json`
- `/v1/audit/:productId` reads directly from SQLite via `getDb()` — `limit`/`offset` validated with `validate()` using `pattern: /^\d+$/` (per the project's query-param validation convention), `limit` capped at 500
- `/v1/portfolio/score` rejects non-array or oversized (`>100`) `product_ids`, silently skips unknown/invalid IDs, and 404s only if *none* resolve

## Open questions / things to watch

- No auth middleware on these routes — they're public, same trust level as `/api/products`. If this API gets billed/metered for B2B customers, it will need its own auth scheme.
- Lives under `/v1` while the rest of the app uses `/api` — intentional versioning choice for an external-facing contract, but means it bypasses the `/api/*` CORS and rate-limit configuration applied elsewhere. Worth confirming this is deliberate before more endpoints are added here.

## Links

- [[Score Audit Service]] — source of the audit-trail data this API exposes
- [[Admin Routes]] — sibling admin-only audit endpoints
- [[Grading Independence Governance]] — business context (this API is the commercial face of the same audit trail built for governance)
- [[GreenGrade Service]] — `calculateGreenGrade()` / `enrichProduct()` reused here
