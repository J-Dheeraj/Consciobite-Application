---
type: entity
title: "Digital Product Passport API"
created: 2026-06-08
status: developing
tags: [entity, b2b, passport, api]
---

# Digital Product Passport API

**File:** `backend/src/routes/passport.js`
**Mounted at:** `/api/v1/*` (passport, portfolio, audit)
**Protection:** none (public, read-only data) — no `requireAuth`/`requireAdmin`

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/v1/passport/:productId` | Single-product sustainability passport: score, percentile, full 7-category emission breakdown, data confidence tier |
| `POST` | `/v1/portfolio/score` | Batch score 1–100 products; returns per-product passports + portfolio summary (avg score, highest/lowest) + per-category benchmarks |
| `GET` | `/v1/audit/:productId` | Paginated score-change history for one product, backed by `score_change_logs` (same table as [[Admin Routes]]'s conflict log, but scoped to a single product and public) |

## Design Notes

- `buildPassport(product)` is the shared shape-builder used by both `passport` and `portfolio` endpoints — calls `calculateGreenGrade()` directly rather than going through the cached `/api/products` enrichment path.
- Product ID validation: `sanitize()` (escape + trim + max 20 chars) then `validator.isAlphanumeric()` — rejects anything that isn't a plain alphanumeric ID before hitting the catalog lookup.
- `POST /v1/portfolio/score` caps batch size at 100 IDs; invalid/missing IDs in the batch are silently skipped (not 400'd individually) so one bad ID doesn't fail the whole portfolio request.
- `methodology_version: "3.0"` is hardcoded in every passport response — ties each passport to the spec in `METHODOLOGY.md`.
- `GET /v1/audit/:productId` exposes the same `score_change_logs` table as the admin conflict log, but without auth and scoped to one product — this is the "third-party verifiable" half of the governance story: an auditor with a product ID can independently confirm score stability without admin credentials.

## Links

- [[Digital Product Passport API 2026-06-08]] — source PR this was introduced in
- [[Score Audit Service]] — underlying audit trail (`score_change_logs`)
- [[Admin Routes]] — the authenticated counterpart (`/api/admin/conflict-log`)
- [[GreenGrade KDE Scoring]] / [[GreenGrade Service]] — scoring engine each passport calls
- [[validate() Middleware]] — used for `/v1/portfolio/score` body and `/v1/audit/:productId` query validation
