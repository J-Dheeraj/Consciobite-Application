---
type: entity
title: "Digital Product Passport API"
created: 2026-06-29
status: developing
tags: [entity, api, b2b, passport, esg]
---

# Digital Product Passport API

**File:** `backend/src/routes/passport.js`
**Mounted at:** `/api/v1/*` (see `backend/src/index.js`)
**Purpose:** B2B endpoints for buyers who need machine-readable GreenGrade data for EU ESPR (Ecodesign for Sustainable Products Regulation) and SGX Scope 3 supply-chain reporting — landed in PR #33 alongside `METHODOLOGY.md` and a B2B-framed README rewrite.

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/v1/passport/:productId` | Single product passport: score, percentile, full 7-category emission breakdown, data confidence tier |
| `POST` | `/v1/portfolio/score` | Batch score 1-100 product IDs; returns per-product passports + portfolio average/highest/lowest + per-category benchmarks |
| `GET` | `/v1/audit/:productId` | Paginated score-change history for a product, pulled from `score_change_logs` (same table [[Score Audit Service]] writes to) |

## Passport Shape

`buildPassport()` calls `calculateGreenGrade()` directly (same scoring path as the rest of the app — no separate B2B scoring logic) and adds passport-specific metadata:

```json
{
  "product_id": "1",
  "product_name": "Firm Tofu",
  "greengrade_score": 8.4,
  "score_percentile": 92,
  "emission_breakdown": { "land_use_change": ..., "animal_feed": ..., "farm_operations": ..., "processing": ..., "transport": ..., "packaging": ..., "retail": ... },
  "total_carbon_footprint_kg_co2e": 1.2,
  "data_confidence_tier": "high",
  "passport_generated_at": "2026-06-29T...",
  "methodology_version": "3.0"
}
```

## Validation

- `productId` params are sanitized (`validator.escape` + trim + 20-char cap) then must pass `validator.isAlphanumeric` — same pattern as other product-ID routes, not the declarative `validate()` schema (path params aren't covered by that middleware).
- `/portfolio/score` uses `validate()` only to require `product_ids` is present; array shape/length (1-100) and per-item type are checked by hand in the handler.
- `/audit/:productId` uses `validate()` for `limit`/`offset` query params with `pattern: /^\d+$/` — consistent with the [[validate() Middleware]] invariant of using `pattern` over `type: "number"`.

## Links

- [[GreenGrade Service]] — scoring logic this API wraps, unchanged
- [[Score Audit Service]] — source of `/v1/audit/:productId` data
- [[validate() Middleware]] — partial use; path params still hand-validated
