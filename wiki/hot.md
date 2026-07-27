---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-07-27
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-07-27 after server-side favorites session.

**Project:** Consciobite — Next.js 14 App Router (static export) + Node.js/Express API + SQLite. Food sustainability app. Rates grocery products A-F using GreenGrade (KDE + sigmoid scoring across 7 lifecycle emission dimensions). Features carbon tracker, barcode scanner (Open Food Facts fallback), recipe recommender, and review system.

**Stack migration (2026-05):** Frontend migrated from CRA-style React SPA to Next.js 14 App Router with `output: 'export'`. Build produces static HTML in `build/` directory (Next.js outputs to `out/`, build script renames via `rm -rf build && mv out build`). Dynamic route `/product/[id]` uses `generateStaticParams()` reading 550 product IDs from `backend/src/data/products.json` at build time. Product page split into server wrapper (`page.js`) + client component (`ProductDetailClient.js`).

**API architecture:** Domain-decomposed modules in `frontend/src/services/` — `httpClient.js` + `products.js`, `auth.js`, `reviews.js`, `carbon.js`, `recipes.js`, `favorites.js`. `httpClient.js` has `getApiBase()` for Render hostname auto-detection (`-app` -> `-api` suffix swap). No `next.config.js` rewrites (incompatible with static export).

**Deployment:** Render Static Site serves `build/` directory. `render.yaml` blueprint uses `runtime: static` with `staticPublishPath: build`. Docker uses repo-root build context (`context: .` in docker-compose.yml) so `generateStaticParams()` can access `backend/src/data/products.json` during build. Nginx serves static files with SPA fallback (`try_files $uri $uri/ /index.html`).

**Docker fix (2026-07-17):** Backend `Dockerfile` lacked `python3 make g++` needed by `better-sqlite3` to compile on Alpine (musl — no prebuilt binary). Added `RUN apk add --no-cache python3 make g++` before `npm ci --production`.

**Server-side favorites (2026-07-27):** Migration `003_favorites.sql` adds `user_favorites` table (user_id FK, product_id, UNIQUE constraint). Routes at `GET/POST/DELETE /api/favorites` — POST toggles (returns `{favorited, productId}`). Frontend: `frontend/src/services/favorites.js` service module; `ProductCard` calls `toggleServerFavorite()` when authenticated with optimistic localStorage update + revert on failure; favorites page uses React Query when authenticated, shows "✓ synced" badge, falls back to localStorage for guests. 10 new tests → **147 backend tests** total. Frontend static build still **566 pages**.

**Active branch:** `claude/dreamy-dirac-o8pvtd` — PR pending against `main`.

**Open PRs (as of 2026-07-27):**
- PR #34 (`claude/dreamy-dirac-fzmsdt`): DPP frontend — still open
- PR #36 (`claude/dreamy-dirac-4ua0hn`): Product recommendations + Similar Products UI
- PR #37 (`claude/dreamy-dirac-6st5cb`): npm audit fix + tier filter + carbon dashboard widget
- PR #38 (`claude/nifty-goodall-1w4m1h`): User profile page + customizable weekly carbon goal

**DPP (Digital Product Passport) backend (merged 2026-07-16):** `/api/passport/:productId`, `POST /api/portfolio/score`, `GET /api/audit/:productId` routes live on main in `backend/src/routes/passport.js`. Frontend passport page in PR #34.

**Governance layer (2026-05-29):** SQLite tables: `manufacturers`, `product_manufacturers`, `score_change_logs`, `product_scores`. Service: `scoreAudit.js`. Admin routes at `/api/admin/*` (requireAdmin middleware). Charter at `/GreenGrade_Governance_Charter.md`. Stack migration plan at [[Stack Migration Plan]].

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
- Favorites routes use `csrfProtection` middleware (POST/DELETE mutate state)
