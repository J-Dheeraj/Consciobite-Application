---
type: entity
title: "Digital Product Passport API"
created: 2026-06-07
status: stable
tags: [entity, b2b, passport, api, governance]
---

# Digital Product Passport API

**File:** `backend/src/routes/passport.js`
**Mounted at:** `/api/v1/passport`, `/api/v1/portfolio`, `/api/v1/audit` (via `app.use("/api/v1", passportRoutes)`)
**Purpose:** B2B endpoints for retailers/manufacturers doing EU ESPR (Ecodesign for Sustainable Products Regulation) and SGX Scope 3 supply-chain reporting.

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/passport/:productId` | Single-product digital passport: GreenGrade score, percentile, full 7-category emission breakdown, data confidence tier, methodology version |
| `POST` | `/api/v1/portfolio/score` | Batch score 1–100 product IDs at once; returns per-product passports + portfolio summary (avg/highest/lowest) + per-category benchmarks |
| `GET` | `/api/v1/audit/:productId` | Paginated score-change history for one product, sourced from `score_change_logs` (same table [[Score Audit Service]] writes to) |

All three validate `productId` as alphanumeric (`validator.isAlphanumeric`, max 20 chars) and 404 on unknown products. `portfolio/score` validates `product_ids` is a 1–100 item string array via the `validate()` middleware + manual checks. `audit/:productId` validates `limit`/`offset` query params with `pattern: /^\d+$/` (capped at 500).

## Why it exists

This is Phase 2/3 of [[Grading Independence Governance]] in API form: `/api/v1/audit/:productId` exposes the same audit trail the admin conflict-log uses, but scoped to one product and publicly reachable — letting a retailer verify a score hasn't been quietly inflated for a paying client.

## Relationship to other services

- Reuses `calculateGreenGrade()` from [[GreenGrade Service]] directly (no duplicate scoring logic)
- Reads `score_change_logs` written by [[Score Audit Service]]
- Documented in `backend/src/swagger.js` alongside the rest of the v1 API

## Links

- [[GreenGrade Service]] — scoring logic reused by `buildPassport()`
- [[Score Audit Service]] — source of audit log rows
- [[Grading Independence Governance]] — governance motivation
- [[Admin Routes]] — the admin-only equivalent of the audit endpoint
