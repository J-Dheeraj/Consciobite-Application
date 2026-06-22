---
type: entity
title: "Digital Product Passport API"
created: 2026-06-22
status: developing
tags: [entity, api, b2b, governance, scoring]
---

# Digital Product Passport API

**File:** `backend/src/routes/passport.js`
**Mounted at:** `/api/v1` (see `backend/src/index.js`)
**Landed:** `8d7ead3` (2026-06-07), merged to `main` via PR #33 (2026-06-08)

B2B-facing endpoint group built for EU ESPR (Digital Product Passport regulation) and SGX Scope 3 carbon reporting. Reframes the product catalog data as structured, regulator-ready output rather than just consumer-facing grades.

---

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/v1/passport/:productId` | Single-SKU passport: score, percentile, 7-category emission breakdown, data confidence tier, total CO2e |
| `POST` | `/v1/portfolio/score` | Batch-score 1–100 product IDs; returns per-product passports + portfolio average, highest/lowest, per-category benchmarks |
| `GET` | `/v1/audit/:productId` | Paginated score-change history for one product, read from `score_change_logs` (`limit`/`offset`, capped at 500) |

## Implementation notes

- `buildPassport(product)` is the shared shaping function — calls `calculateGreenGrade()` then flattens the result into the passport schema (`product_id`, `greengrade_score`, `score_percentile`, `emission_breakdown`, `total_carbon_footprint_kg_co2e`, `data_confidence_tier`, `methodology_version: "3.0"`).
- Product IDs are sanitized with `validator.escape/trim` then required to be `validator.isAlphanumeric` — rejects non-alphanumeric IDs with 400 before hitting the catalog lookup.
- `/portfolio/score` uses the `validate()` middleware only for presence of `product_ids`; array length (1–100) and per-element type checks happen by hand in the handler, not via the schema — worth normalizing into `validate()` if this route grows more body-shape rules.
- `/audit/:productId` reads directly from SQLite (`getDb()`), unlike the other two routes which only touch `products.json` — it's the one passport endpoint with a runtime DB dependency.
- All three endpoints are unauthenticated (no `requireAuth`/`requireAdmin`) — intentional for the B2B pitch (programmatic access for ESG tooling) but means there's currently no API-key gating or rate limiting specific to this route group beyond the global API rate limiter.

## Swagger

Documented under the `Digital Product Passport` tag in `backend/src/swagger.js` (added in the same commit) — full schemas for all three responses, visible at `/api/docs` in dev only (per `CLAUDE.md`, Swagger stays disabled in production).

## Strategic context

Shipped alongside a full `README.md` rewrite that drops "student project" framing in favor of positioning Consciobite as "Southeast Asia's first SKU-level carbon scoring and Digital Product Passport platform for food FMCG brands," targeting SGX-listed manufacturers (Scope 3 disclosure) and EU importers (ESPR). `METHODOLOGY.md` was added as the public-facing technical spec for GreenGrade v3.0, separate from the internal `wiki/` documentation.

## Links

- [[GreenGrade Service]] — scoring engine this API exposes
- [[Score Audit Service]] — backs `/v1/audit/:productId`
- [[Grading Independence Governance]] — same trust narrative this API extends to enterprise buyers
