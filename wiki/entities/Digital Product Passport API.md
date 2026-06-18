---
type: entity
title: "Digital Product Passport API"
created: 2026-06-18
status: mature
tags: [entity, api, b2b, passport, esg, governance]
related: ["[[GreenGrade Service]]", "[[Score Audit Service]]", "[[Admin Routes]]"]
---

# Digital Product Passport API

**File:** `backend/src/routes/passport.js`
**Mounted at:** `/api/v1/*` (versioned, B2B-facing)
**Landed:** PR #33, 2026-06-08 — "feat: add Digital Product Passport API, methodology docs, and cold start UX"

Public (no-auth) B2B endpoints for regulatory carbon reporting — EU ESPR Digital Product Passport requirements and SGX Scope 3 disclosure.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/passport/:productId` | Single-SKU passport: GreenGrade score, percentile, 7-category emission breakdown, total kg CO2e, data confidence tier, methodology version |
| `POST` | `/api/v1/portfolio/score` | Batch-score up to 100 product IDs in one call; returns per-product passports + portfolio average, highest/lowest, category benchmarks |
| `GET` | `/api/v1/audit/:productId` | Paginated score-change history for a product, backed by `score_change_logs` (same table as [[Score Audit Service]]) |

## Implementation notes

- `buildPassport()` wraps `calculateGreenGrade()` from `backend/src/services/greengrade.js` — passport scores are always computed live from `products.json`, not cached, so they can't drift from the live catalog.
- Product IDs are sanitized with `validator.escape/trim` then required to be `isAlphanumeric` before lookup — rejects injection attempts and malformed IDs with 400 before hitting the catalog scan.
- `/audit/:productId` reuses `score_change_logs` directly via `getDb()`; `limit` is clamped to 500 to bound response size.
- All three routes are declared through `validate()` for the query/body shape where applicable, consistent with the project-wide validation invariant.
- Swagger docs updated alongside (`backend/src/swagger.js`) so all three endpoints appear at `/api/docs` in dev.

## Test coverage

Landed without a test file in PR #33 — `backend/__tests__/passport.test.js` was added 2026-06-18 (13 Supertest cases: success/404/400 paths for all three endpoints, including the >100-id portfolio cap and the alphanumeric ID guard) to close the gap against the project rule that every route needs an integration test.

## Why it exists

Investor/governance feedback ([[Grading Independence Governance]]) plus a B2B repositioning (README rewrite, PR #33) reframed Consciobite from a consumer scoring app toward a SEA-native Scope 3 / ESPR compliance data provider for food FMCG brands. The passport endpoints are the product surface for that pivot — see `METHODOLOGY.md` (repo root) for the full GreenGrade v3.0 spec referenced by `methodology_version` in passport responses.
