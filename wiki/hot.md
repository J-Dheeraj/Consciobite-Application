---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-05-14
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-05-14 after session audit on `claude/nifty-goodall-jeEyv`.

**Project:** Consciobite — Next.js 14 App Router SPA + Node.js/Express API + SQLite. Food sustainability app. Rates grocery products A–F using GreenGrade (KDE + sigmoid scoring across 7 lifecycle emission dimensions). Features carbon tracker, barcode scanner (Open Food Facts fallback), recipe recommender, and review system.

**Frontend stack change:** Frontend was migrated from Create React App to **Next.js 14 App Router** (commit `353fef0`). All pages are now under `frontend/src/app/`. Frontend no longer has a `test` script — tests were CRA-specific and have not yet been ported. Build uses static export (`next build && mv out build`).

**All PLAN.md findings resolved:** All 23 graphify audit findings are done (21 ✅, 2 ❌ false positives). No open GitHub issues or PRs.

**Current test status:** 117 backend tests all passing (5 suites: api, auth, carbon, reviews, greengrade). Frontend: no test suite (pending port to Next.js testing framework).

**Latest fix (2026-05-14):** Moved `themeColor` from `metadata` to `viewport` export in `frontend/src/app/layout.js` — Next.js 14 deprecates `themeColor` in metadata. Build now compiles with zero warnings.

**Build health:** `next build` produces 566 static pages, zero warnings, zero errors. ESLint clean. Prettier clean.

**Architectural quirk worth remembering:** The `auth-expired` event bus is the invisible coupling between `safeFetch()` (api.js) and `AuthContext.js`. Fixed with `AUTH_EXPIRED_EVENT` constant in `src/utils/constants.js`.

**Key constants:**
- `AUTH_EXPIRED_EVENT` — `frontend/src/utils/constants.js`
- `WEEKLY_CARBON_GOAL_KG` — `frontend/src/utils/constants.js`
- `OPEN_FOOD_FACTS_TIMEOUT_MS` — `backend/src/routes/products.js`
- `DEFAULT_PORT` — `backend/src/index.js`
- `ALLOWED_ORIGIN_PATTERN` — read from env var in `backend/src/index.js`

**God nodes (graphify 2026-05-10):** `safeFetch()` (21 edges), `ErrorBoundary` (5), `Dashboard()` (5), `calculateGreenGrade()` (5), `ProductDetail()` (4).

**False positives confirmed:**
- B2: Cache only wraps public routes — no per-user data leak risk
- B4: `requireAuth` returns 401 in catch; `optionalAuth` continues without user — both intentional

**Remaining opportunity:** Frontend has no unit/integration tests. Adding Jest + React Testing Library or Playwright E2E would be the natural next step.
