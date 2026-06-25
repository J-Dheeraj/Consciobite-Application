---
type: entity
title: "Digital Product Passport API"
created: 2026-06-25
status: developing
tags: [entity, api, b2b, routes, governance]
related: ["[[GreenGrade Service]]", "[[Score Audit Service]]", "[[Admin Routes]]"]
sources: ["commit 8d7ead3"]
---

# Digital Product Passport API

**File:** `backend/src/routes/passport.js`
**Mounted at:** `/api/v1/*` (see `backend/src/index.js`)
**Purpose:** B2B reporting endpoints — EU ESPR (Digital Product Passport) and SGX Scope 3 disclosure use cases. Landed alongside `METHODOLOGY.md` and a README rewrite that repositions the project from "student project" framing to B2B framing.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/passport/:productId` | Single-product passport: GreenGrade score, percentile, full 7-category emission breakdown, total CO2e, data confidence tier |
| `POST` | `/api/v1/portfolio/score` | Batch score 1–100 product IDs; returns per-product passports + portfolio summary (avg score, highest/lowest) + per-category benchmarks |
| `GET` | `/api/v1/audit/:productId` | Paginated score-change history for a product, backed by `score_change_logs` (same table [[Score Audit Service]] writes to) |

## Implementation notes

- `buildPassport(product)` wraps `calculateGreenGrade()` ([[GreenGrade Service]]) and shapes the output as a stable external contract (`methodology_version: "3.0"`, snake_case keys) — decoupled from the internal `greenGrade` object shape used by `routes/products.js`.
- Product ID validation: `sanitize()` (escape + trim + length cap) then `validator.isAlphanumeric()`. Invalid/missing IDs return 400/404, not 500.
- `/portfolio/score` caps batch size at 100 and silently skips invalid/not-found IDs rather than failing the whole batch — only 404s if *zero* valid products remain.
- `/audit/:productId` reuses the `pattern: /^\d+$/` validation convention for `limit`/`offset` query params (see [[validate() Middleware]]), capping `limit` at 500.
- No `requireAdmin` gate on these routes — they're public B2B-facing reporting endpoints, unlike [[Admin Routes]].

## Links

- Swagger docs for all three endpoints added in `backend/src/swagger.js`.
- Full scoring methodology behind `greengrade_score` is documented in `METHODOLOGY.md` (GreenGrade v3.0 spec — KDE training, bandwidth selection, category/global blending).
