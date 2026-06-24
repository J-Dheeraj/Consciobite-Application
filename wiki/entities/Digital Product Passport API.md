---
type: entity
title: "Digital Product Passport API"
created: 2026-06-24
status: stable
tags: [entity, api, b2b, passport, governance]
---

# Digital Product Passport API

**File:** `backend/src/routes/passport.js`
**Mounted at:** `/v1/*` (B2B namespace, separate from `/api/*`)
**Landed:** `8d7ead3` (2026-06-07), alongside `METHODOLOGY.md`, a README rewrite, and `ApiReadyGate` (see [[API Cold Start Gate]])

B2B-framed read API for EU ESPR and SGX Scope 3 corporate-reporting use cases — lets a buyer pull a structured "passport" for a product or score a whole portfolio without scraping the consumer frontend.

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/v1/passport/:productId` | Single product passport: GreenGrade score + percentile, full 7-category emission breakdown, total kg CO2e, data confidence tier, `methodology_version` |
| `POST` | `/v1/portfolio/score` | Batch passport for 1-100 `product_ids`; returns per-product passports + portfolio summary (average score, highest/lowest) + per-category benchmarks |
| `GET` | `/v1/audit/:productId` | Paginated (`limit`/`offset`, max 500) score-change history for one product, straight from `score_change_logs` |

All three reuse `calculateGreenGrade()` from [[GreenGrade Service]] and `getDb()` from the existing SQLite schema — no new data layer.

## Input handling

`sanitize()` (escape + trim + length cap) and `validator.isAlphanumeric()` gate every product ID before it touches the products array or SQL. `/v1/portfolio/score` is capped at 100 IDs per request and uses the project's `validate()` middleware for the body shape.

## Why `/v1` and not `/api`

Deliberately separated from the consumer `/api/*` surface — this is an external-facing contract for paying B2B integrators (ESPR/Scope 3 reporting), versioned independently of the app's internal API.

## Links

- [[GreenGrade Service]] — scoring function these endpoints wrap
- [[Score Audit Service]] — source of `/v1/audit/:productId`
- [[Grading Independence Governance]] — `methodology_version` ties back to the governance charter's versioned-methodology commitment
