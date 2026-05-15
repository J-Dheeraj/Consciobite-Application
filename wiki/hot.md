---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-05-15
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-05-15 after feature session on `claude/dreamy-dirac-sXNmZ`.

**Project:** Consciobite — Next.js 14 App Router (static export) + Node.js/Express API + SQLite. Food sustainability app. Rates grocery products A-F using GreenGrade (KDE + sigmoid scoring across 7 lifecycle emission dimensions). Features carbon tracker, barcode scanner (Open Food Facts fallback), recipe recommender, and review system.

**Stack migration (2026-05):** Frontend migrated from CRA-style React SPA to Next.js 14 App Router with `output: 'export'`. Build produces static HTML in `build/` directory (Next.js outputs to `out/`, build script renames via `rm -rf build && mv out build`). Dynamic route `/product/[id]` uses `generateStaticParams()` reading 550 product IDs from `backend/src/data/products.json` at build time. Product page split into server wrapper (`page.js`) + client component (`ProductDetailClient.js`).

**API architecture:** Domain-decomposed modules in `frontend/src/services/` — `httpClient.js` + `products.js`, `auth.js`, `reviews.js`, `carbon.js`, `recipes.js`. `httpClient.js` has `getApiBase()` for Render hostname auto-detection (`-app` -> `-api` suffix swap). No `next.config.js` rewrites (incompatible with static export).

**Deployment:** Render Static Site serves `build/` directory. `render.yaml` blueprint uses `runtime: static` with `staticPublishPath: build`. Docker uses repo-root build context (`context: .` in docker-compose.yml) so `generateStaticParams()` can access `backend/src/data/products.json` during build. Nginx serves static files with SPA fallback (`try_files $uri $uri/ /index.html`).

**Recent changes landed (2026-05-15):**
- Fixed hardcoded "576+" product count on home page → corrected to "550+" (3 occurrences in `frontend/src/app/page.js`)
- Added `GET /api/products/:id/recommendations` backend endpoint — returns up to 6 similar products in same category, ranked by score proximity
- Added "Similar Products" section to product detail page (`ProductDetailClient.js`) — horizontal scroll strip of similar products shown below stats; powered by new recommendations endpoint; skipped for Open Food Facts (`off_`) products

**Previous fixes (2026-05-13):**
- 7 merge conflicts resolved, Next.js static export, Docker build context, ESLint migration, validation schema fixes

**Current test status:** 117 backend tests passing. Frontend builds 566 static pages (16 routes + 550 product pages).

**Active branch:** `claude/dreamy-dirac-sXNmZ` (branched from merged `claude/improve-application-S5njo`).

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
- Recommendations route (`/:id/recommendations`) is registered BEFORE the catch-all `/:id` route in products.js
