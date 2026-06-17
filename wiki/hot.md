---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-06-17
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-06-17 — catch-up ingest of governance frontend + Digital Product Passport API (wiki had fallen behind by ~3 weeks of merged work; no open PRs/issues, CI green on `main`).

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

**Current test status:** 117 backend tests passing. Frontend builds 566 static pages (16 routes + 550 product pages).

**Active branch (as of 2026-06-17):** `claude/nifty-goodall-ogigjj`. `claude/improve-application-S5njo` PRs (#30-#33) have all merged into `main`; no open PRs remain.

**Governance layer (2026-05-29):** Session 1 complete. SQLite tables: `manufacturers`, `product_manufacturers`, `score_change_logs`, `product_scores`. Service: `scoreAudit.js` logs every score change with paying-client flag. Admin routes at `/api/admin/*` (requireAdmin middleware, checks `users.role`). Scores snapshotted on startup (550 products); changes auto-detected on server restart. **Charter drafted:** `/GreenGrade_Governance_Charter.md` — 3-seat advisory panel (academic, regulatory, non-client industry), 4 powers (methodology audit, score challenge, conflict flag, annual report), conflict-of-interest firewall, voluntary service. Landing page updated: "Independent Scoring" copy, 550 product count. Stack migration plan at [[Stack Migration Plan]].

**Catch-up since last hot.md update (PRs #31-#33, merged 2026-05-30 to 2026-06-08):**
- **Governance frontend (`b6063fd`, 2026-05-29):** public `/transparency` page (panel seats, commitments, live score-change stats) and admin UI (`/admin/manufacturers` onboarding + fee-ack flow, `/admin/conflict-log`), 20 new integration tests. Closes the "no public disclosure page" gap noted in the previous governance entry — see [[Grading Independence Governance]].
- **README/methodology rewrite (`555a9e3`, `8d7ead3`):** README reframed around B2B (removed "student project" framing); new `METHODOLOGY.md` publishes the full GreenGrade v3.0 technical spec (KDE bandwidth selection, sigmoid transform, category weighting).
- **Digital Product Passport API (`8d7ead3`, 2026-06-07):** new `/v1/passport/:productId`, `/v1/portfolio/score`, `/v1/audit/:productId` B2B endpoints for EU ESPR / SGX Scope 3 reporting — see [[Digital Product Passport API]]. Reuses existing `calculateGreenGrade()` and `score_change_logs`, no new auth layer.
- **Cold-start UX (`8d7ead3`):** `ApiReadyGate` component polls `/health` every 3s (60s cap) and shows a "waking up the server" spinner instead of letting cold-start fetch errors surface — see [[ApiReadyGate Component]].
- **`trailingSlash: true`** added to `next.config.js` (`628903a`, 2026-06-05) to fix 404s on Render static hosting for routes without trailing slashes.
- No open PRs or issues on the repo as of this check. Latest CI run on `main` (2026-06-08) passed.
- Current working branch `claude/nifty-goodall-ogigjj` already contains all of the above (it's ahead of `main`'s last hot.md snapshot, not behind).

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
