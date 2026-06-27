---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-06-27
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-06-27 after wiki catch-up session — see [[log]] for the 2026-06-27 entry.

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

**Current test status (verified 2026-06-27):** 137 backend tests passing across 6 suites (was 117 as of 2026-05-13 — `admin.test.js` alone added 20). `CLAUDE.md` still says 117; not yet corrected there.

**Active branch:** `claude/dreamy-dirac-c3joby`. No open PRs against `main` as of 2026-06-27 — all prior governance/passport work already merged.

**Governance layer — full status (updated 2026-06-27):** SQLite tables: `manufacturers`, `product_manufacturers`, `score_change_logs`, `product_scores`. Service: `scoreAudit.js` logs every score change with paying-client flag. Admin routes at `/api/admin/*` + `/api/v1/admin/*` (requireAdmin middleware, checks `users.role`), now with 20 integration tests. Scores snapshotted on startup (550 products); changes auto-detected on server restart. **Charter drafted:** `/GreenGrade_Governance_Charter.md` — 3-seat advisory panel (academic, regulatory, non-client industry), 4 powers (methodology audit, score challenge, conflict flag, annual report), conflict-of-interest firewall, voluntary service. **Frontend shipped:** `/admin/conflict-log`, `/admin/manufacturers`, public `/transparency` page backed by `GET /api/transparency/stats`. **Only remaining gap:** advisory panel candidates not yet identified; board disclosure page blocked on that. Stack migration plan at [[Stack Migration Plan]].

**Digital Product Passport API (2026-06-07):** B2B endpoints at `/api/v1/passport/:productId`, `/api/v1/portfolio/score` (batch, 1-100 products), `/api/v1/audit/:productId` (public score-change history) — for EU ESPR / SGX Scope 3 reporting. Full spec in `METHODOLOGY.md`. See [[Digital Product Passport API]].

**Cold start UX (2026-06-07):** `ApiReadyGate.js` polls `/api/health` every 3s (60s max wait) before rendering the app, masking Render free-tier backend spin-down. Wrapped around `AuthProvider` in `Providers.js`.

**Repo maintenance (2026-06-27):** Added `CONTRIBUTING.md` (was on the "Known issues / planned improvements" list in `CLAUDE.md` as missing).

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
