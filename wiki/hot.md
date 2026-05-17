---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-05-17
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-05-17 after UX improvement session.

**Project:** Consciobite — Next.js 14 App Router (static export) + Node.js/Express API + SQLite. Food sustainability app. Rates grocery products A-F using GreenGrade (KDE + sigmoid scoring across 7 lifecycle emission dimensions). Features carbon tracker, barcode scanner (Open Food Facts fallback), recipe recommender, and review system.

**Stack migration (2026-05):** Frontend migrated from CRA-style React SPA to Next.js 14 App Router with `output: 'export'`. Build produces static HTML in `build/` directory (Next.js outputs to `out/`, build script renames via `rm -rf build && mv out build`). Dynamic route `/product/[id]` uses `generateStaticParams()` reading 550 product IDs from `backend/src/data/products.json` at build time. Product page split into server wrapper (`page.js`) + client component (`ProductDetailClient.js`).

**API architecture:** Domain-decomposed modules in `frontend/src/services/` — `httpClient.js` + `products.js`, `auth.js`, `reviews.js`, `carbon.js`, `recipes.js`. `httpClient.js` has `getApiBase()` for Render hostname auto-detection (`-app` -> `-api` suffix swap). No `next.config.js` rewrites (incompatible with static export).

**Deployment:** Render Static Site serves `build/` directory. `render.yaml` blueprint uses `runtime: static` with `staticPublishPath: build`. Docker uses repo-root build context (`context: .` in docker-compose.yml) so `generateStaticParams()` can access `backend/src/data/products.json` during build. Nginx serves static files with SPA fallback (`try_files $uri $uri/ /index.html`).

**Recent fixes landed (2026-05-17) — branch `claude/dreamy-dirac-Tt37m`:**
- **Review section on product pages** — `ProductDetailClient.js` now imports and renders the pre-built `ReviewSection` component (star ratings + comment form + list) below the product description. Works for authenticated and unauthenticated users.
- **Carbon log pagination** — `carbon/page.js` refactored from a combined `Promise.all` query to two separate React Query queries (`["carbon","summary"]` + `["carbon","logs", page]`). Shows all 20 logs per page (backend default) with Prev/Next controls. `slice(0, 10)` cap removed.
- **Delete loading state** — `deletingId` state tracks which carbon log is being deleted; button shows `…` and `wait` cursor while in-flight, preventing double-clicks.
- **Barcode input validation** — `scan/page.js` validates manual barcode entry (digits only, 8–14 chars) with inline red error message and red border before hitting the API. Clears on each keystroke.

**Previous fixes landed (2026-05-13):**
- 7 merge conflicts resolved, ESLint migrated, Docker/Render deployment fixed, validate() schemas corrected.

**Current test status:** 117 backend tests passing. Frontend builds 566 static pages (16 routes + 550 product pages).

**Active branch:** `claude/dreamy-dirac-Tt37m` — in progress.

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
- Carbon logs query keys: `["carbon","summary"]` and `["carbon","logs",page]` — invalidate with `queryKey: ["carbon"]` prefix
