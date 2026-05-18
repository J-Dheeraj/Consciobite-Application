---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-05-18
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-05-18 after frontend bug-fix session.

**Project:** Consciobite — Next.js 14 App Router (static export) + Node.js/Express API + SQLite. Food sustainability app. Rates grocery products A-F using GreenGrade (KDE + sigmoid scoring across 7 lifecycle emission dimensions). Features carbon tracker, barcode scanner (Open Food Facts fallback), recipe recommender, and review system.

**Stack migration (2026-05):** Frontend migrated from CRA-style React SPA to Next.js 14 App Router with `output: 'export'`. Build produces static HTML in `build/` directory (Next.js outputs to `out/`, build script renames via `rm -rf build && mv out build`). Dynamic route `/product/[id]` uses `generateStaticParams()` reading 550 product IDs from `backend/src/data/products.json` at build time. Product page split into server wrapper (`page.js`) + client component (`ProductDetailClient.js`).

**API architecture:** Domain-decomposed modules in `frontend/src/services/` — `httpClient.js` + `products.js`, `auth.js`, `reviews.js`, `carbon.js`, `recipes.js`. `httpClient.js` has `getApiBase()` for Render hostname auto-detection (`-app` -> `-api` suffix swap). No `next.config.js` rewrites (incompatible with static export).

**Deployment:** Render Static Site serves `build/` directory. `render.yaml` blueprint uses `runtime: static` with `staticPublishPath: build`. Docker uses repo-root build context (`context: .` in docker-compose.yml) so `generateStaticParams()` can access `backend/src/data/products.json` during build. Nginx serves static files with SPA fallback (`try_files $uri $uri/ /index.html`).

**GreenGrade response shape (critical — don't get wrong again):**
`enrichProduct()` returns `{ ...product, greenGrade: { score, color, totalEmissions, breakdown, confidence, percentile, categoryRank, anomaly, ...provenance } }`. The raw `emissions` object is at `product.emissions` (top-level), NOT inside `greenGrade`. `greenGrade.totalEmissions` is the computed scalar sum. `greenGrade.percentile` is already an integer 0–100 representing "top X% globally" — do NOT subtract from 1 or multiply by 100 again.

**Recent fixes landed (2026-05-18) — branch `claude/dreamy-dirac-bYYNx`:**
- `products/page.js:282` — emissions badge never rendered: guard was checking `p.greenGrade?.emissions` (undefined) instead of `p.greenGrade?.totalEmissions`; fixed condition and value reference
- `ProductDetailClient.js:625` — percentile displayed as huge negative: `Math.round((1 - greenGrade.percentile) * 100)` wrong because percentile is already 0–100; simplified to `greenGrade.percentile`
- `carbon/page.js:122` — React Query error object rendered directly as React child (crash); changed to `error.message`
- `carbon/page.js:97` — weekly progress label capped at 100%, hiding overshoot; separated bar width (capped) from label value (actual)

**Current test status:** 117 backend tests passing. Frontend builds 566 static pages (16 routes + 550 product pages).

**Active branch:** `claude/dreamy-dirac-bYYNx` — pushed, ready for PR.

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
