---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-05-21
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-07-22 — search suggestions endpoint, security audit fix.

**Project:** Consciobite — Next.js 14 App Router (static export) + Node.js/Express API + SQLite. Food sustainability app. Rates grocery products A-F using GreenGrade (KDE + sigmoid scoring across 7 lifecycle emission dimensions). Features carbon tracker, barcode scanner (Open Food Facts fallback), recipe recommender, and review system.

**Stack migration (2026-05):** Frontend migrated from CRA-style React SPA to Next.js 14 App Router with `output: 'export'`. Build produces static HTML in `build/` directory (Next.js outputs to `out/`, build script renames via `rm -rf build && mv out build`). Dynamic route `/product/[id]` uses `generateStaticParams()` reading 550 product IDs from `backend/src/data/products.json` at build time. Product page split into server wrapper (`page.js`) + client component (`ProductDetailClient.js`).

**API architecture:** Domain-decomposed modules in `frontend/src/services/` — `httpClient.js` + `products.js`, `auth.js`, `reviews.js`, `carbon.js`, `recipes.js`. `httpClient.js` has `getApiBase()` for Render hostname auto-detection (`-app` -> `-api` suffix swap). No `next.config.js` rewrites (incompatible with static export).

**Deployment:** Render Static Site serves `build/` directory. `render.yaml` blueprint uses `runtime: static` with `staticPublishPath: build`. Docker uses repo-root build context (`context: .` in docker-compose.yml) so `generateStaticParams()` can access `backend/src/data/products.json` during build. Nginx serves static files with SPA fallback (`try_files $uri $uri/ /index.html`).

**Docker fix (2026-07-17):** Backend `Dockerfile` lacked `python3 make g++` needed by `better-sqlite3` to compile on Alpine (musl — no prebuilt binary). Added `RUN apk add --no-cache python3 make g++` before `npm ci --production`. This was blocking PR #34's Docker Build Check CI job.

**Recent fixes landed (2026-05-13):**
- 7 merge conflicts resolved between feature branch and main
- Backend Prettier/ESLint formatting fixed (4 backend + 9 frontend files)
- `validate()` schema fixes: removed `max: 100` from carbon quantity (let handler clamp), raised reviews `productId` maxLength from 20 to 50, removed UUID patterns from delete schemas (allow non-UUID strings to reach 404)
- Frontend ESLint migrated from `react-app` to `next/core-web-vitals`
- Unescaped JSX entities fixed (`"` -> `&ldquo;`/`&rdquo;`, `'` -> `&apos;`)
- Docker build context changed from `./frontend` to `.` (repo root) so products.json is accessible
- Dockerfile updated for repo-root-relative COPY paths
- `REACT_APP_API_URL` -> `NEXT_PUBLIC_API_URL` in docker-compose.yml

**Current test status:** 143 backend tests on `claude/nifty-goodall-uj91rj` (6 new suggestions tests). Main has 137. Frontend builds 566 static pages (16 routes + 550 product pages).

**DPP (Digital Product Passport) backend (merged 2026-07-16):** `/api/passport/:productId`, `POST /api/portfolio/score`, `GET /api/audit/:productId` routes live on main in `backend/src/routes/passport.js`. Frontend passport page is in PR #34 (branch `claude/dreamy-dirac-fzmsdt`) — failing CI due to `npm audit` (high CVEs). Fix is in `claude/nifty-goodall-uj91rj`.

**Security fix (2026-07-22):** `npm audit fix` bumped `brace-expansion` to 1.1.16 and `js-yaml` to 4.3.0 (and `express` + `qs` + `body-parser`), clearing 2 HIGH-severity CVEs. PR #34's backend test CI will pass once this merges and PR #34 rebases.

**Search suggestions endpoint (2026-07-22):** `GET /api/products/suggestions?q=` returns up to 8 products matching name/brand, sorted by score desc. Validated: q required, minLength 2, maxLength 50. Response: `{suggestions: [{id, name, brand, category, score}], query}`. `fetchSuggestions()` added to frontend services.

**Active branch:** `claude/nifty-goodall-uj91rj` — pushed, PR not yet created.

**Recommendations feature (PR #36, branch `claude/dreamy-dirac-4ua0hn`):** `GET /api/products/:id/recommendations` in products.js; Similar Products section in ProductDetailClient.js; 7 new tests. No CI runs yet.

**Passport feature (PR #34, branch `claude/dreamy-dirac-fzmsdt`):** Frontend page `/passport/[id]`; 36 passport tests; failing CI (npm audit). Will be unblocked after `claude/nifty-goodall-uj91rj` merges.

**Governance layer (2026-05-29):** Session 1 complete. SQLite tables: `manufacturers`, `product_manufacturers`, `score_change_logs`, `product_scores`. Service: `scoreAudit.js` logs every score change with paying-client flag. Admin routes at `/api/admin/*` (requireAdmin middleware, checks `users.role`). Scores snapshotted on startup (550 products); changes auto-detected on server restart. **Charter drafted:** `/GreenGrade_Governance_Charter.md` — 3-seat advisory panel (academic, regulatory, non-client industry), 4 powers (methodology audit, score challenge, conflict flag, annual report), conflict-of-interest firewall, voluntary service. Landing page updated: "Independent Scoring" copy, 550 product count. Stack migration plan at [[Stack Migration Plan]].

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
- Route order in products.js: `/suggestions` and `/stats` must appear before `/:id` to avoid shadowing
- `GET /api/products/suggestions` uses `minLength: 2` (validate() supports minLength/maxLength for strings)
