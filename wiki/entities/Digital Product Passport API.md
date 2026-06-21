---
type: entity
title: "Digital Product Passport API"
created: 2026-06-21
status: developing
tags: [entity, api, b2b, governance]
---

# Digital Product Passport API

**File:** `backend/src/routes/passport.js`
**Mounted at:** `/api/v1` (see `backend/src/index.js`)
**Added:** 2026-06-07, commit `8d7ead3`

B2B-facing endpoints aimed at EU ESPR (Digital Product Passport) and SGX Scope 3 reporting use cases — distinct from the consumer-facing `/api/products` surface. Reuses `calculateGreenGrade()` from [[GreenGrade Service]] rather than duplicating scoring logic.

---

## Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/passport/:productId` | Single-product passport: score, percentile, 7-category emission breakdown, total CO2e, data confidence tier, methodology version |
| `POST /api/v1/portfolio/score` | Scores up to 100 product IDs in one call; returns per-product passports + portfolio average/highest/lowest + per-category benchmarks |
| `GET /api/v1/audit/:productId` | Paginated (`limit`/`offset`, capped at 500) read of `score_change_logs` for one product — reuses the table written by [[Score Audit Service]] |

## Key Design Decisions

- **Input handling:** product IDs are passed through `sanitize()` (trim + `validator.escape`, capped length) then checked with `validator.isAlphanumeric()` before any lookup — rejects injection attempts with 400 rather than 404.
- **Portfolio endpoint silently skips invalid/unknown IDs** rather than failing the whole batch; only 404s if *no* IDs resolve to a product. Lets a B2B caller submit a SKU list without pre-filtering.
- **`validate()` schema on `/audit/:productId`** uses `pattern: /^\d+$/` for `limit`/`offset`, consistent with the project invariant (query params need `pattern`, not `type: "number"`).
- **Cached at the route-group level** — mounted behind `cacheMiddleware(120)` (120s in-memory cache), same mechanism as other GET routes.

## Gap found and closed (2026-06-21)

The feature commit added these three routes with **zero test coverage**, violating the project convention that every new route needs a Supertest integration test. Added `backend/__tests__/passport.test.js` (13 tests: happy path, sanitization/injection rejection, 404s, portfolio batch limits, audit pagination) in this session. Full suite now 150 tests passing (was 137).

## Related frontend change

[[ApiReadyGate Component]] shipped in the same commit — unrelated to the passport API itself, but bundled into the same PR. Polls `/api/health` for up to 60s before rendering children, to mask Render free-tier cold starts.

## Links

- [[GreenGrade Service]] — scoring logic reused by `buildPassport()`
- [[Score Audit Service]] — writes the `score_change_logs` rows read by `/audit/:productId`
- [[Grading Independence Governance]] — business motivation for an audit-trail endpoint
