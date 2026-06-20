---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-06-20
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-06-20 vault sync (no live ingest source — reconciled against git history).

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

**Current test status (verified 2026-06-20):** 137 backend tests passing (up from 117 — 20 governance/admin integration tests added). Backend lint/Prettier and frontend `next lint` both clean. No open GitHub issues or PRs.

**Active branch:** `claude/improve-application-S5njo` was merged to `main` via PR #30, #31, #32, #33 (all closed/merged). Session work now continues on `claude/dreamy-dirac-erixsk`, currently even with `main` (no unique commits, clean tree).

**Governance layer — Sessions 1-4 complete (landed 2026-05-21 through 2026-06-07, never logged in this vault until now):**
- **Session 1 (2026-05-21):** SQLite tables `manufacturers`, `product_manufacturers`, `score_change_logs`, `product_scores`. `scoreAudit.js` logs every score change with paying-client flag. Admin routes at `/api/admin/*` (`requireAdmin` middleware, checks `users.role`). Scores snapshotted on startup (550 products).
- **Session 2 (commit b6063fd, 2026-05-29):** Admin conflict-log frontend page (`frontend/src/app/admin/conflict-log/page.js`) — summary stats, filters, rescore button, full audit table.
- **Session 3 (commit b6063fd):** Public `/transparency` page — governance config, 3 advisory panel seats (all "In formation", not yet confirmed), 5 published commitments, methodology summary + link, live score-change stats from new `GET /api/transparency/stats` endpoint (`backend/src/index.js:194`, cached 300s).
- **Session 4 (commit b6063fd):** Manufacturer onboarding admin page (`frontend/src/app/admin/manufacturers/page.js`) — create form with fee-acknowledgement checkbox, product-manufacturer linking, registered manufacturers table. New `frontend/src/services/admin.js`.
- **Charter** at `/GreenGrade_Governance_Charter.md` — 3-seat advisory panel (academic, regulatory, non-client industry), 4 powers (methodology audit, score challenge, conflict flag, annual report), conflict-of-interest firewall, voluntary service. **Founding candidates still not identified** — this is the actual blocker on the charter's "Activation steps," not a code task.
- Landing page updated: "Independent Scoring" copy, 550 product count.

**B2B Digital Product Passport API (commit 8d7ead3, 2026-06-07):** New `backend/src/routes/passport.js` — `GET /v1/passport/:productId`, `POST /v1/portfolio/score`, `GET /v1/audit/:productId`, aimed at EU ESPR / SGX Scope 3 reporting use cases. `METHODOLOGY.md` added at repo root with full GreenGrade v3.0 spec. README rewritten with B2B framing. New `ApiReadyGate` component handles Render free-tier cold-start loading state.

**Known gap:** `graphify-out/` graph (generated 2026-05-10) still references pre-migration CRA paths (`frontend/src/App.js`, `frontend/src/pages/*`) that no longer exist post-Next.js-migration. The `graphify` Python module is not installed in this sandbox, so it can't be regenerated from here — needs a session with graphify available to refresh `graphify-out/GRAPH_REPORT.md` and `manifest.json`.

Stack migration plan at [[Stack Migration Plan]] — unchanged, not started.

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
