---
type: entity
title: "Digital Product Passport API"
created: 2026-06-18
status: mature
tags: [entity, api, b2b, compliance, backend]
related: ["[[GreenGrade Service]]", "[[Score Audit Service]]", "[[Admin Routes]]"]
---

# Digital Product Passport API

**File:** `backend/src/routes/passport.js`
**Mounted at:** `/api/v1/*` (see `backend/src/index.js`)
**Added:** PR #33, `feat: add Digital Product Passport API, methodology docs, and cold start UX` (commit `8d7ead3`)

B2B-facing API surface added on top of the existing GreenGrade scoring engine. Targets SGX-listed
food manufacturers (Scope 3 reporting) and EU importers (ESPR Digital Product Passport regulation).
This is the commit that repositioned the README from "student project" framing to a B2B SaaS pitch
("Southeast Asia's first SKU-level carbon scoring and Digital Product Passport platform").

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/passport/:productId` | Single-product passport: score, percentile, full emission breakdown, data confidence tier, methodology version |
| `POST` | `/api/v1/portfolio/score` | Batch-score up to 100 product IDs; returns category benchmarks + highest/lowest performers |
| `GET` | `/api/v1/audit/:productId` | Paginated score-change history for one product, reads `score_change_logs` (same table [[Score Audit Service]] writes to) |

## Notes

- Reuses `calculateGreenGrade()` from [[GreenGrade Service]] directly — no new scoring logic, just a new response shape (`buildPassport()`).
- Input sanitization via `validator.escape/trim` + `isAlphanumeric` check on product IDs (max length 20), consistent with the rest of the codebase's `validate()` convention, though this route does manual checks rather than a declarative schema for the path params.
- `portfolio/score` uses the existing `validate()` middleware for the body schema.
- `methodology_version: "3.0"` is hardcoded in `buildPassport()` — there is no version-controlled changelog yet for GreenGrade algorithm parameter changes (see [[Grading Independence Governance]] Phase 2, item 2 — still open).
- Swagger docs updated in `backend/src/swagger.js` for all three endpoints.

## Related changes in the same PR

- `METHODOLOGY.md` (repo root) — full GreenGrade v3.0 technical spec, written for external/compliance audiences.
- `frontend/src/components/ApiReadyGate.js` — cold-start loading gate so the frontend doesn't show errors during Render free-tier backend wake-up (30–60s).
- README.md rewritten end-to-end with B2B/compliance framing (ESPR, SGX Scope 3) replacing the earlier consumer-app description.

## Links

- [[GreenGrade Service]] — scoring engine this API wraps
- [[Score Audit Service]] — audit table the `/audit/:productId` endpoint reads from
- [[Grading Independence Governance]] — business context for the audit trail
