---
type: meta
title: "Operation Log"
created: 2026-04-25
updated: 2026-04-25
status: evergreen
tags: [log, meta]
---

# Operation Log

Append-only. Newest entries at top.

---

## 2026-05-15 — Feature Session: Recommendations + Product Count Fix

**Operation:** Add product recommendations feature and fix factual inaccuracies on branch `claude/dreamy-dirac-sXNmZ`.

**Pages updated:** 2
- `hot.md` — updated with current branch, new features, invariants
- `log.md` — this entry

**Key changes:**
1. **"576+" count fix** — Home page (`frontend/src/app/page.js`) had "576+" hardcoded in 3 places (stats bar, value prop section, final CTA copy). Corrected to "550+" to match actual product catalog size and existing layout.js metadata.
2. **Backend recommendations endpoint** — Added `GET /api/products/:id/recommendations` to `backend/src/routes/products.js`. Returns up to 6 similar products from same category, ranked by score proximity (absolute score difference). Registered before the catch-all `/:id` route to avoid conflicts.
3. **Similar Products UI** — `ProductDetailClient.js` now fetches recommendations via `useQuery` and renders a horizontal scroll strip of up to 6 similar product cards at the bottom of the product detail page. Skipped for Open Food Facts (`off_`) products. Each card shows score badge, product name, and brand with click-through to the product page.

**Commits (chronological):**
- `feat: add product recommendations endpoint and similar products UI`

**Index updated:** no (no new pages)
**Hot cache updated:** yes

---

## 2026-05-13 — CI/Deployment Fix Session

**Operation:** Fix CI failures, Render deployment, Docker build, and merge conflicts on `claude/improve-application-S5njo` branch.

**Pages created:** 3
- `concepts/Static Export Pipeline`
- `concepts/Render Deployment`
- `concepts/Docker Build Context`

**Pages updated:** 4
- `hot.md` — refreshed with current stack, deployment, and fix summary
- `meta/Consciobite Architecture Overview` — updated stack table and directory structure for Next.js
- `architecture/System Overview` — updated for static export and API base detection
- `index.md` — added new concept pages

**Key changes:**
1. **Merge conflicts** — 7 files resolved between feature branch and main
2. **Next.js static export** — `output: 'export'` in next.config.js, build renames `out/` to `build/`
3. **generateStaticParams()** — Dynamic `/product/[id]` split into server wrapper + `ProductDetailClient.js`; reads 550 product IDs from `backend/src/data/products.json` at build time
4. **Docker build context** — Changed from `./frontend` to `.` (repo root) so products.json is accessible during Docker build
5. **Dockerfile** — All COPY paths updated for repo-root context; products.json copied to `/backend/src/data/products.json`
6. **docker-compose.yml** — Fixed build context and env var name (`REACT_APP_API_URL` -> `NEXT_PUBLIC_API_URL`)
7. **ESLint** — Migrated from `react-app` to `next/core-web-vitals`; added `eslint` + `eslint-config-next` to devDependencies
8. **Validation schemas** — Removed `max: 100` from carbon quantity, raised reviews `productId` maxLength, removed UUID patterns from delete schemas
9. **Prettier** — Reformatted 13 files across backend and frontend
10. **JSX entities** — Fixed unescaped quotes in carbon/favorites/login pages

**Commits (chronological):**
- `d31b1b9` — fix: update frontend Dockerfile for Next.js
- `06f889b` — fix: add eslint + eslint-config-next and fix lint errors
- `588a571` — fix: reformat carbon/page.js after entity escaping
- `b3390fd` — fix: update Render deployment for Next.js
- `22d0405` — fix: switch to Next.js static export to match Render static site config
- `5635240` — fix: use repo-root Docker build context so products.json is accessible

**Index updated:** yes
**Hot cache updated:** yes

---

## 2026-04-25 — Migration Brief Review

**Operation:** REVIEW `GREENGRADE_MIGRATION_BRIEF.md` (wiki-query deep mode)
**Pages created:** 2
- `questions/Is the GreenGrade Migration Brief Accurate`
- `sources/GreenGrade Migration Brief 2026-04-25`

**Key findings:** 5 factual errors in the brief (JS not Python, no Tailwind, 550 not 576 products, no water footprint data, products in JSON not SQLite). Session 2 scope severely underestimated — full language rewrite required.

**Index updated:** yes

---

## 2026-04-25 — Initial Ingest

**Operation:** INGEST `.raw/graphify-audit-2026-04-25.md`
**Pages created:** 12
- `sources/Graphify Audit 2026-04-25`
- `entities/CarbonTracker Component`
- `entities/GreenGrade Service`
- `entities/Open Food Facts Integration`
- `entities/RequireAuth Guard`
- `entities/validate() Middleware`
- `concepts/Auth-Expired Event Bus`
- `concepts/GreenGrade KDE Scoring`
- `concepts/Product Catalog Schema`
- `concepts/Validate Middleware Pattern`
- `domains/Backend Security`
- `domains/Frontend Accessibility`
- `domains/Frontend Error Handling`
- `questions/What Did the Graphify Audit Find`
- `meta/Consciobite Architecture Overview`

**Index updated:** yes
**Hot cache updated:** yes
