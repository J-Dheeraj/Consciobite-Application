---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-06-03
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-06-03 after governance Session 3.

**Project:** Consciobite — Next.js 14 App Router (static export) + Node.js/Express API + SQLite. Food sustainability app. Rates grocery products A-F using GreenGrade (KDE + sigmoid scoring across 7 lifecycle emission dimensions). Features carbon tracker, barcode scanner (Open Food Facts fallback), recipe recommender, and review system.

**Stack migration (2026-05):** Frontend migrated from CRA-style React SPA to Next.js 14 App Router with `output: 'export'`. Build produces static HTML in `build/` directory (Next.js outputs to `out/`, build script renames via `rm -rf build && mv out build`). Dynamic route `/product/[id]` uses `generateStaticParams()` reading 550 product IDs from `backend/src/data/products.json` at build time. Product page split into server wrapper (`page.js`) + client component (`ProductDetailClient.js`).

**API architecture:** Domain-decomposed modules in `frontend/src/services/` — `httpClient.js` + `products.js`, `auth.js`, `reviews.js`, `carbon.js`, `recipes.js`, `admin.js`. `httpClient.js` has `getApiBase()` for Render hostname auto-detection (`-app` -> `-api` suffix swap). No `next.config.js` rewrites (incompatible with static export).

**Deployment:** Render Static Site serves `build/` directory. `render.yaml` blueprint uses `runtime: static` with `staticPublishPath: build`. Docker uses repo-root build context (`context: .` in docker-compose.yml) so `generateStaticParams()` can access `backend/src/data/products.json` during build. Nginx serves static files with SPA fallback (`try_files $uri $uri/ /index.html`).

**Current test status:** 145 backend tests passing. Frontend ESLint clean.

**Active branch:** `claude/nifty-goodall-nUc3t` — on branch.

**Governance layer — full state (2026-06-03):**

Session 1 (2026-05-21): SQLite tables `manufacturers`, `product_manufacturers`, `score_change_logs`, `product_scores`. `scoreAudit.js` logs every product score change with paying-client flag. Admin routes at `/api/admin/*` (`requireAdmin` middleware). 550 product scores snapshotted on startup.

Session 2 (2026-05-29): Governance charter drafted (`/GreenGrade_Governance_Charter.md`). Frontend admin pages at `/admin/conflict-log` and `/admin/manufacturers`. Transparency page at `/transparency` showing governance stats. Landing page updated.

Session 3 (2026-06-03): **Methodology changelog** — migration `003_methodology_changelog.sql` adds `methodology_changelog` table seeded with v1.0/v2.0/v3.0 history. `scoreAudit.js` extended with `logMethodologyChange()` / `getMethodologyChangelog()`. New routes: `GET /api/changelog` (public) + `POST /api/admin/changelog` (admin). Admin hub page at `/admin` with nav cards and live stats. Methodology page (`/methodology`) now shows version history section and governance link. 8 new tests.

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
