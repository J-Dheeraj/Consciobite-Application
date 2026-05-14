---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-04-25
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-05-14 — session on branch `claude/dreamy-dirac-ZM2EK`.

**Project:** Consciobite — React 18 SPA + Node.js/Express API + SQLite. Food sustainability app. Rates grocery products A–F using GreenGrade (KDE + sigmoid scoring across 7 lifecycle emission dimensions). Features carbon tracker, barcode scanner (Open Food Facts fallback), recipe recommender, and review system.

**Audit summary (graphify, 2026-04-25):** Full-codebase analysis via AST + LLM semantic knowledge graph. 255 nodes, 45 communities, 23 findings. 2 findings fixed immediately (RequireAuth guard, validate() wiring). 19 additional findings fixed this session. 2 confirmed false positives.

**Key fixes landed:**
- CORS pattern now configurable via `ALLOWED_ORIGIN_PATTERN` env var
- `products.json` validated at startup against required schema (id, name, category, 7 emission keys)
- Async `GET /:id` and `GET /scan/:barcode` handlers wrapped in try/catch
- `validate()` middleware wired into all remaining routes: reviews (GET/POST/DELETE), recipes (GET/GET:id), carbon (GET /logs)
- `OPEN_FOOD_FACTS_TIMEOUT_MS` extracted as named constant
- `DEFAULT_PORT` extracted as named constant
- `AUTH_EXPIRED_EVENT` centralised in `src/utils/constants.js`; both `api.js` and `AuthContext.js` import it
- `WEEKLY_CARBON_GOAL_KG` constant added to shared constants
- 5 silent catch blocks replaced with visible error feedback (CarbonTracker delete, ReviewSection load+delete, ProductDetail log, Compare initial load)
- `aria-label` + `aria-expanded` added to expand/collapse buttons in Tips and Recipes; `aria-label` added to CarbonTracker delete button

**False positives confirmed:**
- B2: Cache only wraps public routes — no per-user data leak risk
- B4: `requireAuth` returns 401 in catch; `optionalAuth` continues without user — both intentional

**Current test status:** 117 backend tests passing. Frontend has no test suite (Next.js App Router, no test runner configured yet). Both backend and frontend lint clean.

**Fixes landed this session (2026-05-14, branch `claude/dreamy-dirac-ZM2EK`, commit 6324416):**
- `backend/src/index.js` — removed unused `DEFAULT_PORT` constant
- `backend/src/services/greengrade.js` — removed unused `DIM` constant
- `backend/__tests__/greengrade.test.js` — removed unused `computeCovarianceInverse` import
- `backend/__tests__/reviews.test.js` — removed unused `userId` variable
- `frontend/src/app/layout.js` — moved `themeColor` from `metadata` to `viewport` export (Next.js 14 deprecation fix)
- `frontend/src/app/carbon/page.js:382` — fixed React anti-pattern `key={i}` → `key={p.product_id}` in topProducts list
- `frontend/src/app/dashboard/page.js:286-287` — added `bestCategory?.category ?? "—"` and `bestCategory?.avgScore ?? "—"` optional-chain guards to prevent null crash when stats return empty categories
- `frontend/src/app/products/page.js:282-294` — fixed emission chip: `p.greenGrade?.emissions` (always undefined) → `p.greenGrade?.totalEmissions !== undefined && ... !== null`; inner value uses `p.greenGrade.totalEmissions.toFixed(1)`
- `frontend/src/app/products/page.js` — added 300 ms `useRef`/`debouncedSearch` debounce on the search input to prevent API spam on every keystroke

**Architectural quirk worth remembering:** The `auth-expired` event bus is the invisible coupling between `safeFetch()` (api.js) and `AuthContext.js`. The graphify graph flagged it because AST cannot see event-name string equality across files; it looked like two unrelated nodes. Fixing it with a shared constant removes the hidden coupling.
