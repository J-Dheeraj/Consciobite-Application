---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-05-13
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-05-24 after transparency/governance Session 3 implementation.

**Project:** Consciobite — Next.js 14 App Router (static export) + Node.js/Express API + SQLite. Food sustainability app. Rates grocery products A-F using GreenGrade (KDE + sigmoid scoring across 7 lifecycle emission dimensions). Features carbon tracker, barcode scanner (Open Food Facts fallback), recipe recommender, and review system.

**Stack migration (2026-05):** Frontend migrated from CRA-style React SPA to Next.js 14 App Router with `output: 'export'`. Build produces static HTML in `build/` directory (Next.js outputs to `out/`, build script renames via `rm -rf build && mv out build`). Dynamic route `/product/[id]` uses `generateStaticParams()` reading 550 product IDs from `backend/src/data/products.json` at build time. Product page split into server wrapper (`page.js`) + client component (`ProductDetailClient.js`).

**API architecture:** Domain-decomposed modules in `frontend/src/services/` — `httpClient.js` + `products.js`, `auth.js`, `reviews.js`, `carbon.js`, `recipes.js`. `httpClient.js` has `getApiBase()` for Render hostname auto-detection (`-app` -> `-api` suffix swap). No `next.config.js` rewrites (incompatible with static export).

**Deployment:** Render Static Site serves `build/` directory. `render.yaml` blueprint uses `runtime: static` with `staticPublishPath: build`. Docker uses repo-root build context (`context: .` in docker-compose.yml) so `generateStaticParams()` can access `backend/src/data/products.json` during build. Nginx serves static files with SPA fallback (`try_files $uri $uri/ /index.html`).

**Governance Session 3 (2026-05-24):** Transparency & independence frontend implemented on `claude/nifty-goodall-a4zAO`.
- Created `frontend/src/app/transparency/page.js` — 6 sections: acknowledged conflict, independence commitments, advisory board (3 seats: academic/regulatory/industry), score integrity mechanisms, FAQ disclosures, regulatory alignment (EU Green Claims Directive, SG Green Plan 2030)
- Updated `frontend/src/app/methodology/page.js` — added "Governance & Independence" SectionCard with advisory board note, score audit trail note, and link to /transparency
- Updated `Navbar.js` — added "Transparency" to both desktop and mobile nav
- Updated `Footer.js` — added Methodology + Transparency to Resources section
- Frontend builds 567 static pages (17 routes + 550 product pages). 0 ESLint warnings. 117 backend tests passing.

**Note:** Governance backend layer (admin routes, scoreAudit.js, migration 002) is in open PR #30 (`claude/improve-application-S5njo`), not yet merged. Transparency page is frontend-only, no dependency on those backend APIs.

**Active branch:** `claude/nifty-goodall-a4zAO` — development branch for Session 3.

**Previous branch:** `claude/improve-application-S5njo` — PR #30 open (governance backend layer, unstable CI — tests pass locally).

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
