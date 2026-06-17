---
type: entity
title: "Digital Product Passport API"
created: 2026-06-17
status: stable
tags: [api, b2b, passport, esg, backend]
---

# Digital Product Passport API

B2B-facing endpoints added 2026-06-07 (`8d7ead3`) so retail/enterprise clients can pull GreenGrade
data for EU ESPR (Ecodesign for Sustainable Products Regulation) and SGX Scope 3 reporting use
cases. Implementation: `backend/src/routes/passport.js`, mounted under `/v1`.

## Endpoints

- `GET /v1/passport/:productId` — single product passport: full emission breakdown across the 7
  GreenGrade categories, total CO2e, data confidence tier, `methodology_version: "3.0"`.
- `POST /v1/portfolio/score` — batch scoring for 1-100 `product_ids`. Returns per-product
  passports plus a `portfolio_summary` (average score, highest/lowest scorer) and
  `category_benchmarks` (per-category count/avg score/avg emissions).
- `GET /v1/audit/:productId` — paginated (`limit`/`offset`, validated via `validate()` with
  `pattern: /^\d+$/`) read of `score_change_logs` for a product, reusing the [[Score Audit Service]]
  table.

## Notable implementation details

- `buildPassport()` reuses `calculateGreenGrade()` from [[GreenGrade Service]] directly — no
  separate scoring path for B2B vs consumer-facing data.
- Product ID input is sanitized with `validator.escape/trim` then required to be alphanumeric
  before the catalog lookup, on all three routes.
- Portfolio scoring silently skips invalid/unknown IDs rather than failing the whole batch; returns
  404 only if zero valid products remain.
- No auth/rate-limit middleware specific to `/v1/*` was added in this change — same global stack
  applies as the rest of the API.

## Links

- [[GreenGrade Service]] — scoring logic reused by `buildPassport()`
- [[Score Audit Service]] — backs the `/v1/audit/:productId` log
- Methodology spec: `METHODOLOGY.md` (repo root) — GreenGrade v3.0 technical specification
