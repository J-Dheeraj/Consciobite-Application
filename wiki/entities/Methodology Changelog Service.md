---
type: entity
title: "Methodology Changelog Service"
created: 2026-06-27
status: done
tags: [governance, audit-trail, methodology, backend]
---

# Methodology Changelog Service

Backend audit trail for changes to the GreenGrade *algorithm itself* — weights, formula, category definitions, data sources. Distinct from [[Score Audit Service]], which tracks per-product score drift, not parameter changes.

Implements Phase 2, item 4 of [[Grading Independence Governance]]: "Audit trail — backend logging for when/why scoring parameters change (currently hardcoded in `backend/src/services/greengrade.js`)."

## Files

| File | Role |
|------|------|
| `backend/src/db/migrations/003_methodology_changelog.sql` | `methodology_changelog` table (id, version, category, summary, commit_ref, changed_by, change_date) + index on change_date. Seeds 3 historical rows (v1.0/v2.0/v3.0) grounded in real git commits `751fd77`, `e0e9f32`, `57e046e`. |
| `backend/src/services/methodologyChangelog.js` | `getMethodologyChangelog({limit, offset})`, `logMethodologyChange({version, category, summary, commitRef, changedBy})`, `VALID_CATEGORIES = ["algorithm", "weights", "data-source", "other"]` |
| `backend/src/routes/admin.js` | `POST /api/admin/methodology-changelog` (admin, validated, calls `invalidateCache("methodology/changelog")` after write) and `GET /api/admin/methodology-changelog` (admin list) |
| `backend/src/index.js` | `GET /api/methodology/changelog` (public, cached 300s) |
| `backend/src/swagger.js` | `MethodologyChangelogEntry` schema + paths for both endpoints |
| `frontend/src/services/recipes.js` | `fetchMethodologyChangelog()` |
| `frontend/src/app/transparency/page.js` | "Methodology Changelog" section — renders version badge, category badge, date, summary per entry via React Query |

## Design notes

- Mirrors the existing audit-trail pattern from [[Score Audit Service]] rather than inventing a new approach.
- The public GET route is cached via `cacheMiddleware(300)`; the admin POST route must call `invalidateCache("methodology/changelog")` after writing, or newly-created entries won't appear on the public endpoint until the cache expires (caught by a test, fixed by following the existing `reviews.js` invalidation pattern).
- Seed data (v1.0/v2.0/v3.0) was deliberately grounded in real commit hashes from `git log --follow -- backend/src/services/greengrade.js` rather than fabricated, since the entire point of a transparency feature is auditability.

## Tests

`backend/__tests__/admin.test.js` — public GET (no auth, returns seeded entries), admin POST (401 unauthenticated, 403 non-admin, 400 invalid category/malformed version/missing summary, 201 + appears on both admin and public GET on success).

Backend suite: 144/144 passing (up from 117 baseline; +27 tests, 0 regressions).

## Known gap (not fixed, out of scope for this session)

Frontend has no `test` npm script and no test files, despite CLAUDE.md documenting `cd frontend && npm test` and requiring a render smoke test per new component. Verified this change instead via `next lint`, `prettier --check`, and a full `npm run build` (569/569 static pages). Building out frontend test infra is a separate, larger task.

## Links

- [[Grading Independence Governance]]
- [[Score Audit Service]]
- [[Admin Routes]]
- [[GreenGrade Service]]
