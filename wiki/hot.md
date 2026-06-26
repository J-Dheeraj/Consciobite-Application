---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-06-26
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-06-26 — wiki catch-up sync (no code changes this session; vault was stale, see [[Digital Product Passport API]]).

**Repo state as of 2026-06-26:** `main` and `claude/nifty-goodall-eew9o3` both at `f0c40d4`. No open PRs, no open issues. Latest CI run on `main` green.

**Since last wiki update (PR #32, #33, landed 2026-06-05 and 2026-06-07):**
- **Routing fix:** `trailingSlash: true` in `next.config.js` — static export was producing flat `route.html` files that Render/nginx couldn't resolve for bare path requests (e.g. `/transparency`). Now generates `route/index.html` everywhere. `nginx.conf` catch-all serves `404.html` for unknown routes instead of `index.html`.
- **Digital Product Passport API** (`backend/src/routes/passport.js`, mounted at `/api/v1`): 3 new public B2B endpoints — `GET /v1/passport/:productId` (single product passport), `POST /v1/portfolio/score` (batch score up to 100 products + category benchmarks), `GET /v1/audit/:productId` (paginated score-change history, reuses `score_change_logs`). No auth/API-key gate — public read-only, same trust tier as `/api/products`, covered only by the global rate limiter.
- **`METHODOLOGY.md`** (repo root) — canonical GreenGrade v3.0 technical spec, written for external/B2B audiences (EU ESPR, SGX Scope 3 reporting). Documents the same KDE+sigmoid algorithm already in [[GreenGrade Algorithm]] / [[GreenGrade KDE Scoring]] — no algorithm change, just formal documentation.
- **README.md rewritten** — B2B framing, removed "student project" language.
- **`ApiReadyGate` component** (`frontend/src/components/ApiReadyGate.js`) — wraps app tree, polls `/api/health` up to 60s before rendering, shows "Waking up the server..." spinner. Addresses Render free-tier cold start (30-60s spin-up after idle).

**Project:** Consciobite — Next.js 14 App Router (static export) + Node.js/Express API + SQLite. Food sustainability app. Rates grocery products A-F using GreenGrade (KDE + sigmoid scoring across 7 lifecycle emission dimensions). Features carbon tracker, barcode scanner (Open Food Facts fallback), recipe recommender, review system, and now a B2B passport/portfolio API.

**Stack migration (2026-05):** Frontend migrated from CRA-style React SPA to Next.js 14 App Router with `output: 'export'`. Build produces static HTML in `build/` directory (Next.js outputs to `out/`, build script renames via `rm -rf build && mv out build`). Dynamic route `/product/[id]` uses `generateStaticParams()` reading 550 product IDs from `backend/src/data/products.json` at build time. Product page split into server wrapper (`page.js`) + client component (`ProductDetailClient.js`).

**API architecture:** Domain-decomposed modules in `frontend/src/services/` — `httpClient.js` + `products.js`, `auth.js`, `reviews.js`, `carbon.js`, `recipes.js`. `httpClient.js` has `getApiBase()` for Render hostname auto-detection (`-app` -> `-api` suffix swap). No `next.config.js` rewrites (incompatible with static export).

**Deployment:** Render Static Site serves `build/` directory. `render.yaml` blueprint uses `runtime: static` with `staticPublishPath: build`. Docker uses repo-root build context (`context: .` in docker-compose.yml) so `generateStaticParams()` can access `backend/src/data/products.json` during build. Nginx serves static files with SPA fallback (`try_files $uri $uri/ /index.html`).

**Recent fixes landed (2026-05-13):**
- 7 merge conflicts resolved between feature branch and main
- Backend Prettier/ESLint formatting fixed (4 backend + 9 frontend files)
- `validate()` schema fixes: removed `max: 100` from carbon quantity (let handler clamp), raised reviews `productId` maxLength from 20 to 50, removed UUID patterns from delete schemas (allow non-UUID strings to reach 404)
- Frontend ESLint migrated from `react-app` to `next/core-web-vitals`
- Unescaped JSX entities fixed (`"` -> `&ldquo;`/`&rdquo;`, `'` -> `&apos;`)
- Docker build context changed from `./frontend` to `.` (repo root) so products.json is accessible
- Dockerfile updated for repo-root-relative COPY paths
- `REACT_APP_API_URL` -> `NEXT_PUBLIC_API_URL` in docker-compose.yml

**Current test status:** 117 backend tests passing. Frontend builds 566 static pages (16 routes + 550 product pages).

**Active branch (historical, 2026-05):** `claude/improve-application-S5njo` was merged via PR #30-#33; as of 2026-06-26 `main` has no open PRs.

**Governance layer (2026-05-29):** Session 1 complete. SQLite tables: `manufacturers`, `product_manufacturers`, `score_change_logs`, `product_scores`. Service: `scoreAudit.js` logs every score change with paying-client flag. Admin routes at `/api/admin/*` (requireAdmin middleware, checks `users.role`). Scores snapshotted on startup (550 products); changes auto-detected on server restart. **Charter drafted:** `/GreenGrade_Governance_Charter.md` — 3-seat advisory panel (academic, regulatory, non-client industry), 4 powers (methodology audit, score challenge, conflict flag, annual report), conflict-of-interest firewall, voluntary service. Landing page updated: "Independent Scoring" copy, 550 product count. Stack migration plan at [[Stack Migration Plan]].

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
