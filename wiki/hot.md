---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-06-18
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-06-18 — wiki catch-up session (vault was stale since 2026-05-29; PR #30/#32/#33 had already merged undocumented) plus a missing test file added.

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

**Current test status:** 150 backend tests passing (was 117 — governance tests landed PR #30, passport tests added 2026-06-18). Frontend builds 566 static pages (16 routes + 550 product pages).

**Active branch:** `claude/improve-application-S5njo` was the long-running feature branch through PR #33 (merged 2026-06-08); this session worked on `claude/nifty-goodall-nx3xrr`, branched from current `main` (no open PRs at session start).

**Governance layer:** Session 1 (2026-05-21) — SQLite tables `manufacturers`, `product_manufacturers`, `score_change_logs`, `product_scores`; `scoreAudit.js`; admin routes at `/api/admin/*`. Charter drafted `/GreenGrade_Governance_Charter.md` (2026-05-29). **Session 2 (2026-05-29, PR #30)** — governance frontend shipped: `/transparency` public dashboard (panel seats, firewall commitments, aggregate stats) and `/admin/conflict-log` + `/admin/manufacturers` admin UI. Panel seats still all `confirmed: false` — people/process gap, not code. See [[Grading Independence Governance]].

**B2B pivot (PR #33, 2026-06-08):** [[Digital Product Passport API]] added at `/api/v1/*` — `GET /passport/:productId`, `POST /portfolio/score` (up to 100 SKUs), `GET /audit/:productId`. `METHODOLOGY.md` (repo root) carries the full GreenGrade v3.0 spec. README rewritten with B2B/ESG framing (SGX Scope 3, EU ESPR). [[Cold Start UX]] (`ApiReadyGate.js`) added to mask Render free-tier cold starts.

Stack migration plan at [[Stack Migration Plan]] (still not started).

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
