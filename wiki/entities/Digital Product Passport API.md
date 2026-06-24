---
type: entity
title: "Digital Product Passport API"
created: 2026-06-24
status: developing
tags: [entity, backend, b2b, api]
---

# Digital Product Passport API

B2B API surface added in PR #33 (`backend/src/routes/passport.js`) for EU ESPR (Ecodesign for Sustainable Products Regulation) and SGX Scope 3 reporting use cases — lets enterprise clients pull machine-readable GreenGrade data for compliance reporting rather than scraping the consumer-facing site.

## Endpoints

- `GET /v1/passport/:productId` — single-product passport: score, percentile, full 7-category emission breakdown, total CO2e, data confidence tier, methodology version. Product ID validated with `validator.isAlphanumeric` after sanitization (max 20 chars).
- `POST /v1/portfolio/score` — batch scoring. Body: `{ product_ids: [...] }`, 1–100 items, validated via the standard `validate()` middleware (`PORTFOLIO_SCHEMA`).
- `GET /v1/audit/:productId` — per-product score change history (wraps [[Score Audit Service]] data) for compliance audit trails.

## Implementation notes

- Reuses `calculateGreenGrade()` from [[GreenGrade Service]] — no separate scoring path, so passport data can't drift from consumer-facing scores.
- Reads from `backend/src/data/products.json` directly (same static catalog as the rest of the app — see [[Product Catalog Schema]]).
- Registered in `backend/src/index.js`; documented in Swagger (`backend/src/swagger.js`).
- `methodology_version` is hardcoded `"3.0"` in the passport payload — must be kept in sync manually with `METHODOLOGY.md` if the algorithm version changes.

## Links

- [[GreenGrade Service]] — scoring logic reused here
- [[Score Audit Service]] — backs the `/v1/audit/:productId` endpoint
- [[validate() Middleware]] — validates `/v1/portfolio/score` body
