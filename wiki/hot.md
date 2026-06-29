---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-06-29
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-06-29 after maintenance sweep (wiki catch-up + passport API test coverage).

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

**Current test status:** 150 backend tests passing (`npm test` in `backend/`). Frontend builds 566 static pages (16 routes + 550 product pages), `next lint` clean. Frontend has no test runner/script configured yet — no `*.test.js` files exist under `frontend/src/`, despite the CLAUDE.md convention requiring render smoke tests. Pre-existing gap, not yet addressed.

**Active branch:** `main` is current. PRs #30-#33 (governance frontend, charter docs, admin test suite, Digital Product Passport API) all merged. This session worked on `claude/dreamy-dirac-j06kch`.

**Governance layer — now feature-complete through Phase 2 (2026-06-29):** Backend audit trail (Session 1, 2026-05-21) + governance frontend (Sessions 2-4, PR #31, merged 2026-05-29): admin conflict-log page (`/admin/conflict-log`, stats + filters + rescore), public `/transparency` page (panel seats, commitments, live stats from `GET /api/transparency/stats`), manufacturer onboarding admin UI (`/admin/manufacturers`, fee acknowledgement, product linking). Charter at `/GreenGrade_Governance_Charter.md` — 3-seat advisory panel (academic, regulatory, non-client industry), 4 powers (methodology audit, score challenge, conflict flag, annual report), conflict-of-interest firewall, voluntary service. **Only outstanding Phase 1 item: founding panel members not yet identified** — no code work blocks this, it's a business/recruiting task. Stack migration plan at [[Stack Migration Plan]].

**Digital Product Passport API (PR #33, merged 2026-06-08):** B2B endpoints at `/api/v1/passport/:productId`, `/api/v1/portfolio/score`, `/api/v1/audit/:productId` for EU ESPR and SGX Scope 3 reporting — see [[Digital Product Passport API]]. Shipped with `METHODOLOGY.md` (full GreenGrade v3.0 spec), a B2B-framed `README.md` rewrite, and `ApiReadyGate` component for Render free-tier cold-start UX. **Shipped without tests** — closed this session by adding `backend/__tests__/passport.test.js` (13 tests covering all 3 routes, validation edge cases, and 404s).

**Static hosting fix (PR #32, merged 2026-06-05):** `trailingSlash: true` added to `next.config.js` — without it, routes like `/transparency` 404'd on Render/nginx because static export produced flat `transparency.html` files instead of `transparency/index.html`.

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
