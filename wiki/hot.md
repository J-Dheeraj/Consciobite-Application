---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-07-23
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-07-23 after User Profile feature session.

**Project:** Consciobite — Next.js 14 App Router (static export) + Node.js/Express API + SQLite. Food sustainability app. Rates grocery products A-F using GreenGrade (KDE + sigmoid scoring across 7 lifecycle emission dimensions). Features carbon tracker, barcode scanner (Open Food Facts fallback), recipe recommender, review system, product recommendations, and user profile management.

**Stack migration (2026-05):** Frontend migrated from CRA-style React SPA to Next.js 14 App Router with `output: 'export'`. Build produces static HTML in `build/` directory. Dynamic route `/product/[id]` uses `generateStaticParams()` reading 550 product IDs from `backend/src/data/products.json` at build time.

**API architecture:** Domain-decomposed modules in `frontend/src/services/` — `httpClient.js` + `products.js`, `auth.js`, `reviews.js`, `carbon.js`, `recipes.js`. `httpClient.js` has `getApiBase()` for Render hostname auto-detection (`-app` -> `-api` suffix swap). No `next.config.js` rewrites (incompatible with static export).

**Deployment:** Render Static Site serves `build/` directory. Docker uses repo-root build context. Nginx serves static files with SPA fallback. Alpine musl requires build tools (`python3 make g++`) in Dockerfile for `better-sqlite3` native compilation — already added.

**Current test status:** 147 backend tests passing (6 suites). Frontend builds 567 static pages (17 routes + 550 product pages).

**User Profile feature (2026-07-23):** New in branch `claude/nifty-goodall-qppn2p`.
- `PATCH /api/auth/profile` — update display name (validate + sanitize)
- `PATCH /api/auth/password` — change password with current-password verification and complexity check
- `GET /api/auth/stats` — reviews count, carbon entries, total CO₂e
- CORS updated to allow PATCH method
- Auth rate limiter skips in test mode (`skip: () => NODE_ENV === "test"`) to prevent exhaustion across test suite
- `/profile` page: account details card with inline name edit, activity stat tiles (3-up), password change form
- Navbar: username is now a `<Link href="/profile">` instead of a plain `<span>`; mobile menu name also links to profile
- 9 new Supertest tests added to auth.test.js (covers all 3 endpoints, 401s, validation errors, happy paths)

**DPP (Digital Product Passport) backend (merged):** `/api/passport/:productId`, `POST /api/portfolio/score`, `GET /api/audit/:productId` routes live on main. Frontend passport page is in PR #34 (branch `claude/dreamy-dirac-fzmsdt`) — failing CI due to npm audit vulnerabilities (fixed in PR #37).

**Open PRs:**
- **PR #34** (`claude/dreamy-dirac-fzmsdt`) — DPP frontend; Backend Tests failing due to audit vulns. Will pass once PR #37 merges to main and it rebases.
- **PR #36** (`claude/dreamy-dirac-4ua0hn`) — Product recommendations endpoint + Similar Products UI
- **PR #37** (`claude/dreamy-dirac-6st5cb`) — npm audit fix + tier filter + carbon dashboard widget; all CI green ✅
- **PR TBD** (`claude/nifty-goodall-qppn2p`) — User Profile feature (this session)

**Governance layer (2026-05-29):** SQLite tables: `manufacturers`, `product_manufacturers`, `score_change_logs`, `product_scores`. Service: `scoreAudit.js`. Admin routes at `/api/admin/*`. Charter at `GreenGrade_Governance_Charter.md`.

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
- CORS allowed methods: GET, POST, PUT, PATCH, DELETE
