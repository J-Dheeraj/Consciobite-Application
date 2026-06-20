---
type: entity
title: "Digital Product Passport API"
created: 2026-06-20
status: stable
tags: [entity, api, b2b, passport, esrs]
---

# Digital Product Passport API

**File:** `backend/src/routes/passport.js`
**Mounted at:** `/v1/*` (versioned separately from the `/api/*` consumer surface)
**Added:** commit `8d7ead3` (2026-06-07)

B2B reporting endpoints aimed at manufacturers/retailers needing machine-readable carbon data for EU ESPR (Ecodesign for Sustainable Products Regulation) and SGX Scope 3 disclosure use cases.

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/v1/passport/:productId` | Full per-product carbon passport: GreenGrade score, percentile, 7-category emission breakdown, total CO2e, data confidence tier |
| `POST` | `/v1/portfolio/score` | Batch scoring across a manufacturer's product portfolio |
| `GET` | `/v1/audit/:productId` | Audit trail for a single product's score history |

## Passport Response Shape

Built by `buildPassport()` in `passport.js`, which calls `calculateGreenGrade()` directly (same scoring path as the consumer `/api/products/:id` route — no duplicate scoring logic):

```json
{
  "product_id": "123",
  "product_name": "...",
  "brand": "...",
  "category": "...",
  "greengrade_score": 8.2,
  "score_percentile": 91,
  "emission_breakdown": {
    "land_use_change": 0,
    "animal_feed": 0,
    "farm_operations": 0,
    "processing": 0,
    "transport": 0,
    "packaging": 0,
    "retail": 0
  },
  "total_carbon_footprint_kg_co2e": 0,
  "data_confidence_tier": 1,
  "data_confidence_label": "...",
  "passport_generated_at": "ISO timestamp",
  "methodology_version": "3.0"
}
```

Input is sanitized via `validator.escape()`/`validator.trim()` and checked with `validator.isAlphanumeric()` before lookup — same input-hardening pattern as the rest of the product routes, though this route does not use the shared `validate()` middleware (worth normalizing if this surface grows).

## Links

- [[GreenGrade Service]] — `calculateGreenGrade()` is shared, not reimplemented
- [[Grading Independence Governance]] — methodology version `3.0` referenced here matches `METHODOLOGY.md`
