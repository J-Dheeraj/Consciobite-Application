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

**Last updated:** 2026-05-13 — session on branch `claude/nifty-goodall-wcPQN`.

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

**Current test status:** 117 backend tests passing. Frontend has testing libraries installed (@testing-library/react) but no test script defined — tests can't be run yet.

**Fixes landed this session (2026-05-13, branch claude/nifty-goodall-wcPQN):**
- `dashboard/page.js:286` — `bestCategory` null-access crash: added optional-chain guard (`bestCategory?.category ?? "—"`) so an empty stats response can't crash the page
- `products/page.js:282` — emission chip was never rendered: `greenGrade` exposes `.totalEmissions` (not `.emissions.total`); chip now correctly reads `p.greenGrade.totalEmissions`
- `products/page.js:113` — search fired an API call on every keystroke: added 300 ms `useRef` debounce (same pattern as home page), reducing backend load during typing

**Architectural quirk worth remembering:** The `auth-expired` event bus is the invisible coupling between `safeFetch()` (api.js) and `AuthContext.js`. The graphify graph flagged it because AST cannot see event-name string equality across files; it looked like two unrelated nodes. Fixing it with a shared constant removes the hidden coupling.
