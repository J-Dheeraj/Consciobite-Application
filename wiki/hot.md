---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-06-14
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-06-14 after Digital Product Passport frontend + tests session.

**Project:** Consciobite — Next.js 14 App Router (static export) + Node.js/Express API + SQLite. Food sustainability app. Rates grocery products A-F using GreenGrade (KDE + sigmoid scoring across 7 lifecycle emission dimensions). Features carbon tracker, barcode scanner (Open Food Facts fallback), recipe recommender, and review system.

**Stack migration (2026-05):** Frontend migrated from CRA-style React SPA to Next.js 14 App Router with `output: 'export'`. Build produces static HTML in `build/` directory (Next.js outputs to `out/`, build script renames via `rm -rf build && mv out build`). Dynamic route `/product/[id]` uses `generateStaticParams()` reading 550 product IDs from `backend/src/data/products.json` at build time. Product page split into server wrapper (`page.js`) + client component (`ProductDetailClient.js`).

**API architecture:** Domain-decomposed modules in `frontend/src/services/` — `httpClient.js` + `products.js`, `auth.js`, `reviews.js`, `carbon.js`, `recipes.js`, `passport.js`. `httpClient.js` has `getApiBase()` for Render hostname auto-detection (`-app` -> `-api` suffix swap). Passport/portfolio/audit API is at `/api/v1/*` — accessed via `${API_BASE}/v1/...` in the passport service module.

**Deployment:** Render Static Site serves `build/` directory. `render.yaml` blueprint uses `runtime: static` with `staticPublishPath: build`. Docker uses repo-root build context (`context: .` in docker-compose.yml) so `generateStaticParams()` can access `backend/src/data/products.json` during build. Nginx serves static files with SPA fallback (`try_files $uri $uri/ /index.html`).

**Current test status:** 156 backend tests passing (7 test files). Frontend: ESLint clean. Static pages: 550 product pages + 550 passport pages + 16 other routes.

**Active branch:** `claude/nifty-goodall-72dnlb`

**Governance layer (2026-05-29):** Complete. SQLite tables: `manufacturers`, `product_manufacturers`, `score_change_logs`, `product_scores`. Service: `scoreAudit.js` logs every score change with paying-client flag. Admin routes at `/api/admin/*` (requireAdmin middleware). Transparency page at `/transparency` with live score-change stats from API.

**Digital Product Passport (2026-06-14):**
- Backend: `backend/src/routes/passport.js` — mounted at `/api/v1`. Routes: `GET /passport/:productId`, `POST /portfolio/score`, `GET /audit/:productId`.
- Tests: `backend/__tests__/passport.test.js` — 19 tests covering all 3 endpoints.
- Frontend service: `frontend/src/services/passport.js` — `fetchPassport()`, `fetchPortfolioScore()`, `fetchProductAudit()`.
- Frontend page: `/passport/[id]` — static export with `generateStaticParams()` (550 pages). Server wrapper `page.js` + client component `PassportClient.js`.
- Product detail page: "Digital Product Passport →" link added to sustainability verdict card.

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
- Passport routes at `/api/v1/*` (not wrapped in CSRF protection — read-only + POST for portfolio scoring which is unauthenticated)
