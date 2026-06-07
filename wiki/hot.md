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

**Last updated:** 2026-06-07 after methodology changelog feature (Session 3 governance).

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

**Current test status:** 147 backend tests passing. Frontend builds 566 static pages (16 routes + 550 product pages).

**Active branch:** `claude/dreamy-dirac-A8jRU` — pushed to remote, ready for PR.

**Governance layer (complete as of 2026-06-07):**
- Session 1 (2026-05-21): SQLite tables `manufacturers`, `product_manufacturers`, `score_change_logs`, `product_scores`. `scoreAudit.js` logs every score change with paying-client flag. Admin routes at `/api/admin/*` (requireAdmin). 550 product scores snapshotted on startup.
- Session 2 (2026-05-29): Charter drafted at `/GreenGrade_Governance_Charter.md`. Transparency page at `/transparency`. Admin conflict-log UI at `/admin/conflict-log`.
- Session 3 (2026-06-07): **Methodology Changelog** — migration `003_methodology_changelog.sql`, `methodology_changelog` table seeded with v3.0 entry. `logMethodologyChange()` / `getMethodologyChangelog()` in `scoreAudit.js`. Admin route `POST /api/admin/methodology-change` (validated, admin-only). Public route `GET /api/transparency/changelog`. Transparency page now shows changelog section with colour-coded type badges. 10 new tests.

**Phase 2 Governance Status:**
| Feature | Status |
|---------|--------|
| Methodology page enhancement | ✅ Done |
| Scoring changelog | ✅ Done (Session 3) |
| Board disclosure page | ✅ Done (transparency page) |
| Score change audit trail | ✅ Done (Session 1) |

**Known remaining:**
- Advisory Panel candidates not yet identified (governance/business task, not code)
- No frontend tests (CLAUDE.md requirement — planned)
- No CONTRIBUTING.md (planned)

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
