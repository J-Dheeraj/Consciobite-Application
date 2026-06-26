---
type: entity
title: "Digital Product Passport API"
created: 2026-06-26
updated: 2026-06-26
status: mature
tags: [api, backend, governance, b2b]
related: ["[[GreenGrade Service]]", "[[Score Audit Service]]", "[[Grading Independence Governance]]"]
sources: ["commit 8d7ead3"]
---

# Digital Product Passport API

`backend/src/routes/passport.js`, mounted in `backend/src/index.js`. Public (no auth) read-only API aimed at retail/B2B partners who want machine-readable GreenGrade data, not just the HTML product pages.

## Routes

### `GET /api/passport/:productId`
Returns a single product's full passport: identity (id/name/brand/category), `greengrade_score` + `score_percentile`, the 7-category `emission_breakdown`, `total_carbon_footprint_kg_co2e`, data confidence tier/label, and `methodology_version` (currently `"3.0"`, matches the version shown on `/transparency`). Built by `buildPassport()`, which calls `calculateGreenGrade()` from [[GreenGrade Service]] on the fly rather than reading a cached score.

### `POST /api/portfolio/score`
Batch scoring for a retailer's product list. Body: `{ product_ids: string[] }`, 1–100 items, validated via the shared `validate()` middleware plus manual array/length/type checks. Returns each product's passport plus a `portfolio_summary` (average score, highest/lowest scorer) and `category_benchmarks` (per-category average score and emissions). Invalid/unknown IDs are silently skipped rather than failing the whole batch; a 404 is only returned if *none* resolve.

### `GET /api/audit/:productId`
Public, paginated (`limit` capped at 500, `offset`) view into that product's rows in `score_change_logs` (same table [[Score Audit Service]] writes to). Lets an external party verify a specific product's score history without admin credentials — this is the technical backbone of the "audit trail" claim on `/transparency`.

## Input handling

All three routes sanitize path/body IDs with `validator.escape/trim` + `isAlphanumeric` (via the `validator` npm package) before doing a `String(id) === ` lookup against `products.json` — the catalog is small (550 entries) so a linear `find()` is used rather than an index.

## Why it exists

Strengthens the governance/transparency story ([[Grading Independence Governance]]): a retailer can pull this API directly and diff it against what's shown in the Consciobite UI, rather than trusting a rendered page.
