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

**Last updated:** 2026-05-13 — session on branch `claude/dreamy-dirac-E7XTw`.

**Project:** Consciobite — Next.js 14 App Router SPA + Node.js/Express API + SQLite. Food sustainability app. Rates grocery products A–F using GreenGrade (KDE + sigmoid scoring across 7 lifecycle emission dimensions). Features carbon tracker, barcode scanner (Open Food Facts fallback), recipe recommender, and review system.

**Current state (2026-05-13):**
All 23 graphify audit findings from 2026-04-25 are resolved. Branch `claude/dreamy-dirac-E7XTw` starts fresh from main (PR #28 merged). First commit on new branch: code-quality cleanup.

**Fixes landed this session (commit f39b27d):**
- Removed unused `DEFAULT_PORT` constant from `backend/src/index.js` (port default already lives in `config.js`)
- Removed unused `DIM` constant from `backend/src/services/greengrade.js`
- Removed unused `computeCovarianceInverse` import from `backend/__tests__/greengrade.test.js`
- Removed unused `userId` variable from `backend/__tests__/reviews.test.js`
- Fixed React anti-pattern: `key={i}` → `key={p.product_id}` in `frontend/src/app/carbon/page.js` topProducts list

**Previously landed (earlier sessions, now on main):**
- CORS pattern configurable via `ALLOWED_ORIGIN_PATTERN` env var
- `products.json` validated at startup against required schema
- Async route handlers wrapped in try/catch
- `validate()` middleware wired into all routes
- `AUTH_EXPIRED_EVENT` centralised constant
- `WEEKLY_CARBON_GOAL_KG` constant added to shared constants
- 5 silent catch blocks replaced with visible error feedback
- Accessibility: `aria-label`/`aria-expanded` on expand/collapse and delete buttons

**False positives confirmed:**
- B2: Cache only wraps public routes — no per-user data leak risk
- B4: `requireAuth` returns 401 in catch; `optionalAuth` deliberately continues without user

**Current test status:** 117 backend tests all passing. Frontend has no test suite yet.

**Backend lint status:** Clean — 0 errors, 0 warnings after this session's fixes.

**Architectural quirk worth remembering:** The `auth-expired` event bus couples `safeFetch()` (api.js) and `AuthContext.js`. Fixed with `AUTH_EXPIRED_EVENT` shared constant. The Html5Qrcode `start()` per-frame error callback in `scan/page.js` is intentionally `() => {}` — this fires on every non-QR frame and silencing it is correct.
