---
type: entity
title: "Digital Product Passport API"
created: 2026-06-26
status: developing
tags: [entity, api, b2b, governance]
---

# Digital Product Passport API

**File:** `backend/src/routes/passport.js`
**Mounted at:** `/api/v1` (landed 2026-06-07, commit `8d7ead3`)

B2B-facing endpoint group added to support EU ESPR (Espace Produit Régénérateur) and SGX Scope 3 supply-chain disclosure use cases — external companies querying GreenGrade data programmatically rather than through the consumer UI.

---

## Endpoints

| Route | Method | Purpose |
|---|---|---|
| `/v1/passport/:productId` | GET | Single-product passport: full emission breakdown, score, percentile, data confidence tier |
| `/v1/portfolio/score` | POST | Batch score 1-100 products by ID; returns per-product passports + portfolio average/highest/lowest + per-category benchmarks |
| `/v1/audit/:productId` | GET | Paginated score-change history for a product, reading directly from `score_change_logs` (reuses the governance audit trail — see [[Score Audit Service]]) |

## Key implementation details

- `enrichProduct()` / `buildPassport()` wrap `calculateGreenGrade()` (see [[GreenGrade Service]]) — passport data is computed live from `products.json`, not cached separately.
- Product ID sanitization: `validator.escape` + `validator.trim` + `isAlphanumeric` check before lookup — same defensive pattern as other ID-bearing routes.
- `/portfolio/score` uses `validate()` middleware (see [[Validate Middleware Pattern]]) only for presence of `product_ids`; array shape/bounds (1-100 items, all strings) are checked manually in the handler rather than via the declarative schema.
- `/audit/:productId` reuses the `score_change_logs` table populated by `scoreAudit.js` — no new table added.
- Mounted with `cacheMiddleware(120)` (same 120s GET cache as `/api/products`).

## Security note

These routes sit under the global `/api/` rate limiter (`apiLimiter`, applied at `backend/src/index.js:132`) but have **no auth or API-key requirement** — they're public read-only endpoints, same trust level as `/api/products`. This is consistent with the rest of the public catalog API but worth knowing before treating this as an authenticated "B2B" tier in documentation or sales material.

## Links

- [[GreenGrade Service]] — scoring logic the passport wraps
- [[Score Audit Service]] — backs the `/audit` endpoint
- [[Grading Independence Governance]] — business context for external auditability
