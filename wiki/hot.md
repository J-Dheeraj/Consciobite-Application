---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-06-28
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-06-28 after wiki/code sync (PR #32, #33 backfilled).

**Project:** Consciobite — Next.js 14 App Router (static export) + Node.js/Express API + SQLite. Food sustainability app. Rates grocery products A-F using GreenGrade (KDE + sigmoid scoring across 7 lifecycle emission dimensions). Features carbon tracker, barcode scanner (Open Food Facts fallback), recipe recommender, and review system.

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

**Current test status (2026-06-28):** 147 backend tests passing across 7 suites (the "117" figure above is stale — PR #32 added 20 admin governance tests, this session added 9 more). Frontend builds 566 static pages (16 routes + 550 product pages).

**Active branch:** `claude/dreamy-dirac-nq0mq4` — created off `main` (f0c40d4) for this session's work. Prior feature branch `claude/improve-application-S5njo` has been merged (PRs #29-#33).

**Governance layer (2026-05-29, Session 1):** SQLite tables: `manufacturers`, `product_manufacturers`, `score_change_logs`, `product_scores`. Service: `scoreAudit.js` logs every score change with paying-client flag. Admin routes at `/api/admin/*` (requireAdmin middleware, checks `users.role`). Scores snapshotted on startup (550 products); changes auto-detected on server restart. **Charter drafted:** `/GreenGrade_Governance_Charter.md` — 3-seat advisory panel (academic, regulatory, non-client industry), 4 powers (methodology audit, score challenge, conflict flag, annual report), conflict-of-interest firewall, voluntary service. Landing page updated: "Independent Scoring" copy, 550 product count. Stack migration plan at [[Stack Migration Plan]].

**Governance frontend (PR #31/#32, 2026-05-29 to 2026-06-05):** `frontend/src/app/admin/conflict-log/page.js` — admin audit UI (stats, paying/non-paying filter, rescore trigger, delta table). `frontend/src/app/admin/manufacturers/page.js` — manufacturer onboarding form + product-manufacturer linker + fee-acknowledgement table. `frontend/src/app/transparency/page.js` — **public** page showing governance config (3 panel seats, currently "In formation"), 5 commitments, methodology version badge, and live stats from `GET /api/transparency/stats`. Service module `frontend/src/services/admin.js` wraps all admin + transparency calls. `628903a` added `trailingSlash: true` to `next.config.js` to fix 404s on static hosting (Render).

**Digital Product Passport API (PR #33, 8d7ead3, 2026-06-07):** New `backend/src/routes/passport.js`, mounted under `/v1`. Three B2B endpoints for EU ESPR / SGX Scope 3 reporting: `GET /v1/passport/:productId` (single product passport with 7-dim emission breakdown + confidence tier), `POST /v1/portfolio/score` (bulk score up to 100 products + category benchmarks), `GET /v1/audit/:productId` (paginated score-change history per product). Also landed: `METHODOLOGY.md` (290-line full GreenGrade v3.0 spec — KDE bandwidth, 60/40 category/global blend, sigmoid k=5, Mahalanobis χ²₀.₉₅,₇=14.067), `frontend/src/app/methodology/page.js` rewritten to render `GET /api/methodology` live, and `frontend/src/components/ApiReadyGate.js` (cold-start UX — polls `/health` every 3s up to 60s with a "waking up the server" message for Render free-tier cold starts).

**Methodology changelog shipped (2026-06-28):** Closed a gap found during this session's wiki sync — `methodology_version` had been a hardcoded `"3.0"` string duplicated in `dataProvenance.js` and `passport.js`, with nothing logging when/why the algorithm itself changed (`score_change_logs` only audits per-product score deltas). Added `methodology_versions` SQLite table (migration `003`), `backend/src/services/methodologyChangelog.js`, public `GET /api/methodology/changelog`, and admin-only `POST /api/admin/methodology-version`. Both `getMethodology()` and the passport API now read the version from this table. See [[Methodology Changelog Service]] and [[Grading Independence Governance]] Phase 2.

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
