---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-06-19
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-06-19 after scoring parameter audit trail session.

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

**Current test status:** 140 backend tests passing (was 117 as of 2026-05-29; +23 from PR #33's untracked work, +3 from this session). Frontend builds 566 static pages (16 routes + 550 product pages).

**Branch note:** CLAUDE.md still lists `claude/improve-application-S5njo` as active, but PR #33 from that branch was merged 2026-06-07 (`f0c40d4`) and `main` has no other open PRs. This session ran on a fresh branch (`claude/dreamy-dirac-ipaap5`) off current `main`.

**Governance layer — Session 1 (2026-05-29, still accurate):** SQLite tables: `manufacturers`, `product_manufacturers`, `score_change_logs`, `product_scores`. Service: `scoreAudit.js` logs every score change with paying-client flag. Admin routes at `/api/admin/*` (requireAdmin middleware, checks `users.role`). Scores snapshotted on startup (550 products); changes auto-detected on server restart. Charter drafted at `/GreenGrade_Governance_Charter.md` — 3-seat advisory panel, 4 powers, conflict-of-interest firewall, voluntary service. Stack migration plan at [[Stack Migration Plan]].

**Governance layer — PR #33 (merged 2026-06-07, previously unlogged):** Digital Product Passport API (`backend/src/routes/passport.js`): `GET /api/v1/passport/:productId`, `POST /api/v1/portfolio/score` (up to 100 SKUs), `GET /api/v1/audit/:productId` (public version of the score-change audit trail, for EU ESPR / SGX Scope 3 reporting). New `METHODOLOGY.md` at repo root (GreenGrade v3.0 spec). `ApiReadyGate` component + cold-start UX for Render free-tier backend wake-up. `trailingSlash` fix for static-host 404s.

**Governance layer — Session 2 (this session, 2026-06-19):** Closed Phase 2's last open code item: [[Parameter Audit Service]] (`backend/src/services/parameterAudit.js`) audits changes to GreenGrade's *algorithm constants* (fallback maximums, anomaly chi-squared threshold, blend weights) — separate from `scoreAudit.js`, which audits per-*product* score changes. New migration `003_parameter_audit.sql` → `model_parameter_logs` table. New admin endpoint `GET /api/admin/parameter-log`. `greengrade.js` gained `getModelParameters()` and named `CATEGORY_BLEND_WEIGHT`/`GLOBAL_BLEND_WEIGHT` constants (previously inline `0.6`/`0.4`). Hash-based change detection verified idempotent across repeated server startups. Remaining governance work is non-technical: confirming 3 real Advisory Panel candidates (transparency page currently shows placeholder seats).

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
