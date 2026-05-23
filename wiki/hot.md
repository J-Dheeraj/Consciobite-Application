---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-05-23
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-05-23 after governance Session 3 (transparency features).

**Project:** Consciobite — Next.js 14 App Router (static export) + Node.js/Express API + SQLite. Food sustainability app. Rates grocery products A-F using GreenGrade (KDE + sigmoid scoring across 7 lifecycle emission dimensions). Features carbon tracker, barcode scanner (Open Food Facts fallback), recipe recommender, and review system.

**Stack migration (2026-05):** Frontend migrated from CRA-style React SPA to Next.js 14 App Router with `output: 'export'`. Build produces static HTML in `build/` directory (Next.js outputs to `out/`, build script renames via `rm -rf build && mv out build`). Dynamic route `/product/[id]` uses `generateStaticParams()` reading 550 product IDs from `backend/src/data/products.json` at build time. Product page split into server wrapper (`page.js`) + client component (`ProductDetailClient.js`).

**API architecture:** Domain-decomposed modules in `frontend/src/services/` — `httpClient.js` + `products.js`, `auth.js`, `reviews.js`, `carbon.js`, `recipes.js`. `httpClient.js` has `getApiBase()` for Render hostname auto-detection (`-app` -> `-api` suffix swap). No `next.config.js` rewrites (incompatible with static export).

**Deployment:** Render Static Site serves `build/` directory. `render.yaml` blueprint uses `runtime: static` with `staticPublishPath: build`. Docker uses repo-root build context (`context: .` in docker-compose.yml) so `generateStaticParams()` can access `backend/src/data/products.json` during build. Nginx serves static files with SPA fallback (`try_files $uri $uri/ /index.html`).

**Governance layer (2026-05-21, Session 1 — merged in PR #29):**
- SQLite tables: `manufacturers`, `product_manufacturers`, `score_change_logs`, `product_scores`; `users.role` column added
- `backend/src/services/scoreAudit.js` — logs every score change with paying-client flag
- `backend/src/routes/admin.js` — admin-protected CRUD and conflict-log at `/api/admin/*`
- Scores snapshotted on startup (550 products); drift auto-detected on server restart

**Transparency features (2026-05-23, Session 3 — active branch `claude/nifty-goodall-CtzdW`):**
- `backend/src/routes/transparency.js` — public `GET /api/transparency` returning governance commitments, advisory board structure (forming), and 12-month audit stats
- `frontend/src/app/transparency/page.js` — public governance & audit stats page at `/transparency`
- `frontend/src/app/methodology/page.js` — added "Scoring Independence & Governance" section + link to `/transparency`
- `frontend/src/services/recipes.js` — added `fetchTransparency()` export

**Current test status:** 117 backend tests passing. Frontend builds 567 static pages (17 routes + 550 product pages).

**Active branch:** `claude/nifty-goodall-CtzdW`

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
