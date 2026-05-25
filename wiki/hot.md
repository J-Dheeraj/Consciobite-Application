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

**Last updated:** 2026-05-25 after backend hardening + frontend UX session.

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

**Recent fixes landed (2026-05-25):**
- Carbon log `emissions` field now bounded to max 1000 kg CO₂e (+ test)
- Auth routes log structured events: `auth.login.success`, `auth.login.failed`, `auth.register.success`, `auth.logout`
- `requestLogger` now attaches `crypto.randomUUID()` as `req.requestId` and emits `X-Request-Id` response header
- `/api/health` now pings SQLite (`SELECT 1`), returns `db` status + `uptime` seconds; returns 503 if DB is down
- Home page search shows inline error banner on fetch failure (no more silent empty results)
- Search debounce uses `AbortController` — in-flight requests cancelled on unmount or new keystroke
- Product detail page: `useQuery` now has `retry: 2` with exponential backoff
- Product detail error screen: "Try Again" button added (calls `refetch()`), shown only when there is a fetch error

**Current test status:** 118 backend tests passing. Frontend builds 566 static pages (16 routes + 550 product pages).

**Active branch:** `claude/nifty-goodall-lRjMk` — work committed and pushed.

**Key invariants (unchanged):**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- httpOnly cookies for JWT; CSRF double-submit pattern
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
