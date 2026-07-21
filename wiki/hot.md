---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-07-21
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-07-21 — recommendations endpoint + Similar Products UI; PR #35 merged; PR #34 rebased; PR #36 opened.

**Project:** Consciobite — Next.js 14 App Router (static export) + Node.js/Express API + SQLite. Food sustainability app. Rates grocery products A-F using GreenGrade (KDE + sigmoid scoring across 7 lifecycle emission dimensions). Features carbon tracker, barcode scanner (Open Food Facts fallback), recipe recommender, and review system.

**Stack migration (2026-05):** Frontend migrated from CRA-style React SPA to Next.js 14 App Router with `output: 'export'`. Build produces static HTML in `build/` directory (Next.js outputs to `out/`, build script renames via `rm -rf build && mv out build`). Dynamic route `/product/[id]` uses `generateStaticParams()` reading 550 product IDs from `backend/src/data/products.json` at build time. Product page split into server wrapper (`page.js`) + client component (`ProductDetailClient.js`).

**API architecture:** Domain-decomposed modules in `frontend/src/services/` — `httpClient.js` + `products.js`, `auth.js`, `reviews.js`, `carbon.js`, `recipes.js`. `httpClient.js` has `getApiBase()` for Render hostname auto-detection (`-app` -> `-api` suffix swap). No `next.config.js` rewrites (incompatible with static export).

**Deployment:** Render Static Site serves `build/` directory. `render.yaml` blueprint uses `runtime: static` with `staticPublishPath: build`. Docker uses repo-root build context (`context: .` in docker-compose.yml) so `generateStaticParams()` can access `backend/src/data/products.json` during build. Nginx serves static files with SPA fallback (`try_files $uri $uri/ /index.html`).

**Docker fix (merged PR #35, 2026-07-17):** Backend `Dockerfile` lacked `python3 make g++` needed by `better-sqlite3` to compile on Alpine. Added `RUN apk add --no-cache python3 make g++` before `npm ci --production`. Also added `CONTRIBUTING.md`.

**Recent fixes landed (2026-05-13):**
- 7 merge conflicts resolved between feature branch and main
- Backend Prettier/ESLint formatting fixed (4 backend + 9 frontend files)
- `validate()` schema fixes: removed `max: 100` from carbon quantity (let handler clamp), raised reviews `productId` maxLength from 20 to 50, removed UUID patterns from delete schemas (allow non-UUID strings to reach 404)
- Frontend ESLint migrated from `react-app` to `next/core-web-vitals`
- Unescaped JSX entities fixed (`"` -> `&ldquo;`/`&rdquo;`, `'` -> `&apos;`)
- Docker build context changed from `./frontend` to `.` (repo root) so products.json is accessible
- Dockerfile updated for repo-root-relative COPY paths
- `REACT_APP_API_URL` -> `NEXT_PUBLIC_API_URL` in docker-compose.yml

**Current test status:** 144 backend tests passing (7 new recommendations tests added). Frontend builds 566 static pages (16 routes + 550 product pages).

**Active branch:** `claude/dreamy-dirac-4ua0hn` — PR #36 open against `main`.

**Recommendations feature (PR #36, 2026-07-21):**
- Backend: `GET /api/products/:id/recommendations` in `backend/src/routes/products.js` — returns up to 6 products from same category, sorted by score desc, excludes self. 400 for invalid ID, 404 for unknown product.
- Frontend: Similar Products section added to `ProductDetailClient.js` — card list with name, brand, colour-coded score; fetched via `useQuery(["recommendations", id], ...)`. Rendered above Back button.
- Tests: 7 new Supertest tests in `backend/__tests__/api.test.js`

**Passport feature (PR #34, branch `claude/dreamy-dirac-fzmsdt`, rebased 2026-07-21):**
- Backend: `/api/v1/passport/:id`, `/api/v1/portfolio/score`, `/api/v1/audit/:id` routes (merged in PR #33)
- Frontend page: `/passport/[id]` — `PassportCard` with SVG score ring, 7-dimension emission bars, confidence tier badge
- `generateStaticParams()` generates 550 passport pages
- "Eco Passport" button added to product detail page
- PR #34 was rebased onto main (picks up Dockerfile fix from PR #35)

**Governance layer (2026-05-29):** Session 1 complete. SQLite tables: `manufacturers`, `product_manufacturers`, `score_change_logs`, `product_scores`. Service: `scoreAudit.js` logs every score change with paying-client flag. Admin routes at `/api/admin/*` (requireAdmin middleware, checks `users.role`). Scores snapshotted on startup (550 products); changes auto-detected on server restart. **Charter drafted:** `/GreenGrade_Governance_Charter.md` — 3-seat advisory panel (academic, regulatory, non-client industry), 4 powers (methodology audit, score challenge, conflict flag, annual report), conflict-of-interest firewall, voluntary service. Landing page updated: "Independent Scoring" copy, 550 product count. Stack migration plan at [[Stack Migration Plan]].

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
- Route order: `/:id/recommendations` must appear before `/:id` in `routes/products.js`
