---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-06-13
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-06-13 after passport tests + admin nav link session.

**Project:** Consciobite — Next.js 14 App Router (static export) + Node.js/Express API + SQLite. Food sustainability app. Rates grocery products A-F using GreenGrade (KDE + sigmoid scoring across 7 lifecycle emission dimensions). Features carbon tracker, barcode scanner (Open Food Facts fallback), recipe recommender, and review system.

**Stack migration (2026-05):** Frontend migrated from CRA-style React SPA to Next.js 14 App Router with `output: 'export'`. Build produces static HTML in `build/` directory. Dynamic route `/product/[id]` uses `generateStaticParams()` reading 550 product IDs from `backend/src/data/products.json` at build time.

**API architecture:** Domain-decomposed modules in `frontend/src/services/` — `httpClient.js` + `products.js`, `auth.js`, `reviews.js`, `carbon.js`, `recipes.js`, `admin.js`. `httpClient.js` has `getApiBase()` for Render hostname auto-detection. No `next.config.js` rewrites (incompatible with static export).

**Deployment:** Render Static Site serves `build/` directory. Docker uses repo-root build context so `generateStaticParams()` can access `backend/src/data/products.json` during build.

**Current test status:** 160 backend tests passing (7 test suites). Frontend builds 566 static pages (16 routes + 550 product pages).

**Active branch:** `claude/nifty-goodall-go7acy` — feature work from 2026-06-13.

**Previous branch:** `claude/improve-application-S5njo` — all merged to main via PRs #29–#33.

**Feature inventory (all merged to main):**
- Core: products browse/search, barcode scan, product comparison, carbon tracker, recipes, dashboard, tips, favorites
- Auth: JWT + httpOnly cookies, CSRF double-submit, account lockout (5 attempts), role column on users table
- Governance: score audit trail (`scoreAudit.js`), admin routes (`/api/admin/*`), manufacturer tracking, conflict log, transparency page (`/transparency`), admin frontend (`/admin/conflict-log`, `/admin/manufacturers`)
- B2B: Digital Product Passport API (`GET /api/v1/passport/:id`, `POST /api/v1/portfolio/score`, `GET /api/v1/audit/:id`)
- UX: ApiReadyGate component for Render free-tier cold start, trailingSlash in next.config.js for static hosting
- Docs: METHODOLOGY.md (full GreenGrade v3.0 spec), README.md rewritten with B2B framing

**Session 2026-06-13 changes (on branch `claude/nifty-goodall-go7acy`):**
- `backend/__tests__/passport.test.js` — 23 new tests covering all 3 passport endpoints + transparency stats (total: 160 tests, up from 137)
- `backend/src/routes/auth.js` — login and `/me` now include `role` in user response
- `frontend/src/components/Navbar.js` — Admin nav link shown conditionally for `user.role === 'admin'`

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
- Admin routes use `requireAdmin` middleware — backend always re-checks role regardless of client-side UI
