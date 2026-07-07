---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-07-07
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-07-07 after passport test coverage session.

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

**Current test status:** 158 backend tests passing (7 test suites). Frontend builds 566 static pages (16 routes + 550 product pages).

**Active branch:** `claude/nifty-goodall-q43xo0` — 1 commit ahead of `main`, pushed.

**Previous work merged (PRs #29–#33):**
- Governance layer: `manufacturers`, `product_manufacturers`, `score_change_logs`, `product_scores` SQLite tables; `scoreAudit.js`; admin routes at `/api/admin/*`; `requireAdmin` middleware
- GreenGrade Governance Charter at repo root
- Governance frontend: admin audit page, transparency page, manufacturer onboarding form
- Digital Product Passport API: B2B endpoints at `/api/v1/passport/:id`, `/api/v1/portfolio/score`, `/api/v1/audit/:id` (EU ESPR / SGX Scope 3 reporting)
- `ApiReadyGate` component for Render free-tier cold start UX
- `METHODOLOGY.md` with full GreenGrade v3.0 technical specification
- Methodology page in frontend (`/methodology`) — React Query, data confidence tiers, dimension descriptions, sources, limitations, references

**Session 2026-07-07:**
- Created `backend/__tests__/passport.test.js` — 21 integration tests covering all three passport API endpoints (was the only route with zero test coverage)
- Removed unused ESLint warnings: `DEFAULT_PORT` in `index.js` (superseded by `CONFIG.port`) and `DIM` in `greengrade.js` (EMISSION_KEYS.length used inline throughout)
- Backend: ESLint clean (0 warnings), Prettier clean, 158/158 tests pass

**Governance layer (2026-05-29):** Session 1 complete. SQLite tables: `manufacturers`, `product_manufacturers`, `score_change_logs`, `product_scores`. Service: `scoreAudit.js` logs every score change with paying-client flag. Admin routes at `/api/admin/*` (requireAdmin middleware, checks `users.role`). Scores snapshotted on startup (550 products); changes auto-detected on server restart. **Charter drafted:** `/GreenGrade_Governance_Charter.md` — 3-seat advisory panel (academic, regulatory, non-client industry), 4 powers (methodology audit, score challenge, conflict flag, annual report), conflict-of-interest firewall, voluntary service. Landing page updated: "Independent Scoring" copy, 550 product count. Stack migration plan at [[Stack Migration Plan]].

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
