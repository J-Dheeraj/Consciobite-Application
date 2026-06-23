---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-06-23
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-06-23 after scoring changelog session.

**Since 2026-05-29 (catch-up):** PR #30 shipped the governance frontend — `/admin/conflict-log`, `/admin/manufacturers`, and the public `/transparency` page (panel seat cards, commitments, live score-change stats from the audit trail). PR #33 added a B2B Digital Product Passport API (`/v1/passport/:productId`, `/v1/portfolio/score`, `/v1/audit/:productId` for EU ESPR / SGX Scope 3 reporting), `METHODOLOGY.md`, a B2B-framed README rewrite, and an `ApiReadyGate` cold-start UX component for the Render free-tier backend. All merged to `main` (real GitHub, not the local git proxy — the proxy's cached `origin/main` lags behind and should not be trusted for "is this merged" checks; use the GitHub MCP tools instead).

**2026-06-23 session:** Closed Phase 2 item 2 of the governance plan — added a scoring changelog. `backend/src/services/dataProvenance.js` now exports `METHODOLOGY_CHANGELOG`, a 5-entry version history (v1.0 linear scoring → v3.1 audit trail) built from real `git log` dates on `greengrade.js`/`scoreAudit.js`, not invented. Exposed via the existing `getMethodology().changelog` field on `GET /api/methodology`, rendered as a new section on `/methodology`, documented in Swagger. Added a Supertest case in `api.test.js`. 138 backend tests pass (was 117 — the gap is the 20 admin governance tests from PR #30 plus this 1). Frontend builds clean (569 static pages). Pushed to `claude/nifty-goodall-lh9jvu`.

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

**Current test status:** 138 backend tests passing. Frontend builds 569 static pages (19 routes + 550 product pages).

**Active branch:** `claude/nifty-goodall-lh9jvu` (this session). `claude/improve-application-S5njo` was the prior session's branch — its PRs (#30–#33) are all merged to `main`.

**Governance layer (2026-05-29):** Session 1 complete. SQLite tables: `manufacturers`, `product_manufacturers`, `score_change_logs`, `product_scores`. Service: `scoreAudit.js` logs every score change with paying-client flag. Admin routes at `/api/admin/*` (requireAdmin middleware, checks `users.role`). Scores snapshotted on startup (550 products); changes auto-detected on server restart. **Charter drafted:** `/GreenGrade_Governance_Charter.md` — 3-seat advisory panel (academic, regulatory, non-client industry), 4 powers (methodology audit, score challenge, conflict flag, annual report), conflict-of-interest firewall, voluntary service. Landing page updated: "Independent Scoring" copy, 550 product count. Stack migration plan at [[Stack Migration Plan]].

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
