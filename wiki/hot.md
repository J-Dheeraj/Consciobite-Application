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

**Last updated:** 2026-06-26 after scheduled maintenance session (wiki catch-up + CONTRIBUTING.md).

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

**Current test status (2026-06-26):** 137 backend tests passing (`npm test` in `backend/`, was 117). Frontend builds clean — 569 static pages (19 routes + 550 product pages, up from 566/16 — `/transparency`, `/admin/conflict-log`, `/admin/manufacturers` added). Pre-existing, unfixed Next.js build warning: `themeColor` in `metadata` export should move to `generateViewport` (cosmetic, not breaking).

**Active branch:** `claude/improve-application-S5njo` was the long-running feature branch (PRs #29–#33, all merged into `main` as of commit `f0c40d4`, 2026-06-08). This session works on `claude/dreamy-dirac-r9n6lj`.

**Governance layer — now substantially complete (as of 2026-06-26, work landed 2026-05-29 to 2026-06-08, just not previously logged in this vault):**
- Session 1 (DB layer): SQLite tables `manufacturers`, `product_manufacturers`, `score_change_logs`, `product_scores`. `scoreAudit.js` logs every score change with paying-client flag. Admin routes at `/api/admin/*` (`requireAdmin` middleware checks `users.role`). Scores snapshotted on startup (550 products); drift auto-detected on restart.
- Charter drafted: `/GreenGrade_Governance_Charter.md` — 3-seat advisory panel (academic, regulatory, non-client industry), 4 powers (methodology audit, score challenge, conflict flag, annual report), conflict-of-interest firewall, voluntary service.
- Sessions 2–4 (frontend, PR #30-31): `/admin/conflict-log` (stats, filters, rescore button, audit table), `/admin/manufacturers` (onboarding form with fee-acknowledgement checkbox, product-manufacturer linking), public `/transparency` page (Panel seats, firewall commitments, methodology summary, live paying-vs-non-paying score-delta stats from `GET /api/transparency/stats`).
- Landing page: "Independent Scoring" copy, 550 product count.
- **Digital Product Passport API (PR #33, commit `8d7ead3`):** `backend/src/routes/passport.js` — `GET /api/passport/:productId`, `POST /api/portfolio/score` (batch, 1-100 products, category benchmarks), `GET /api/audit/:productId` (public paginated audit trail). See [[Digital Product Passport API]]. Same commit added `METHODOLOGY.md`, expanded Swagger docs, and `ApiReadyGate.js` (frontend cold-start spinner — polls `/health` up to 60s while Render's free-tier backend wakes up, wraps `AuthProvider` in `Providers.js`).
- **Remaining:** only the 3 advisory-panel seats are unfilled (recruiting task, not code) and Phase 3 certification (long-term, not started).

Stack migration plan at [[Stack Migration Plan]] — still not started (Prisma/Tailwind/Supabase), no urgency.

**Tooling note:** `graphify-out/` is stale (last full build 2026-05-10, predates the Next.js migration — `manifest.json` still references the old CRA `frontend/src/App.js`). The `graphify` Python module referenced in `CLAUDE.md` for incremental rebuilds is not installed in this sandbox, so it could not be refreshed this session. Treat `graphify-out/GRAPH_REPORT.md` as historical only; use direct file reads / Explore agent for current-state questions until graphify is reinstalled and rebuilt.

**2026-06-26 session:** Added `CONTRIBUTING.md` at repo root (explicitly listed as a planned-but-missing item in `CLAUDE.md`'s "Known issues" section) — covers branch naming, commit convention, local dev setup, test/lint requirements, and PR expectations already documented informally in `CLAUDE.md`. No application code changed; this was wiki catch-up + the one clearly-scoped open gap.

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
