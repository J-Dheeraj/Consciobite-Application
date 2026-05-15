---
type: overview
title: "Consciobite Architecture Overview"
created: 2026-04-25
updated: 2026-05-13
status: developing
tags: [architecture, overview, consciobite]
related: ["[[GreenGrade Service]]", "[[GreenGrade KDE Scoring]]", "[[Product Catalog Schema]]", "[[Auth-Expired Event Bus]]", "[[RequireAuth Guard]]", "[[Static Export Pipeline]]", "[[Render Deployment]]", "[[Docker Build Context]]"]
sources: ["[[.raw/graphify-audit-2026-04-25.md]]"]
---

# Consciobite Architecture Overview

Food sustainability app. Rates grocery products using GreenGrade (A-F, 1-10 score) based on lifecycle carbon emissions.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 App Router (static export), TanStack React Query |
| Backend | Node.js, Express, SQLite (better-sqlite3) |
| Auth | JWT HS256 (httpOnly cookies), CSRF double-submit, account lockout |
| ML | Custom KDE + sigmoid scoring (greengrade.js) |
| External | Open Food Facts API (barcode fallback) |
| Infra | Render.com (static + web service), Docker (nginx), CI with Prettier + ESLint |

## Directory Structure

```
Consciobite-Application/
├── frontend/src/
│   ├── app/            — Next.js App Router pages (layout.js, page.js per route)
│   │   ├── product/[id]/ — generateStaticParams + ProductDetailClient
│   │   ├── carbon/     — Carbon tracker (RequireAuth protected)
│   │   ├── dashboard/  — User dashboard
│   │   └── ...         — about, compare, favorites, login, register, scan, tips
│   ├── components/     — ReviewSection, GradeBadge, Navbar, Spinner ...
│   ├── context/        — AuthContext, ThemeContext
│   ├── services/       — httpClient.js + domain modules (products, auth, reviews, carbon, recipes)
│   └── utils/          — constants.js, favorites.js, pageStyles.js
├── backend/src/
│   ├── routes/         — products, auth, reviews, carbon, recipes
│   ├── middleware/     — auth, validate, cache, logger
│   ├── services/       — greengrade.js, dataProvenance.js
│   ├── data/           — products.json (550 products)
│   └── db/             — schema.js (SQLite init)
├── docker-compose.yml  — Multi-service Docker setup (repo-root build context)
├── render.yaml         — Render Blueprint (static frontend + node backend)
└── wiki/               — this knowledge base
```

## Key Data Flows

**Product scoring:**
`products.json` -> `trainModel()` -> per-request `calculateGreenGrade()` -> `enrichProduct()` -> API response

**Barcode scan:**
`GET /api/products/scan/:barcode` -> local catalog -> OpenFoodFacts fallback -> `enrichProduct()`

**Carbon logging:**
`POST /api/carbon/log` (auth required, validate()) -> SQLite `carbon_logs` table

**Auto-logout:**
401 from any API call -> `httpClient` fires `AUTH_EXPIRED_EVENT` -> `AuthContext` clears state + localStorage

**Static build:**
`next build` -> `generateStaticParams()` reads `products.json` -> pre-renders 550 product pages -> `mv out build`

## API Communication

Frontend uses `httpClient.js` with `getApiBase()` for runtime API base detection:
- **Local dev:** `/api` (proxied via next.config.js dev server)
- **Render:** Auto-detects `consciobite-api.onrender.com` from hostname
- **Docker:** Configured via `NEXT_PUBLIC_API_URL` build arg

## Decisions of Note

- Products are pre-enriched at module load (`enrichedProducts = products.map(enrichProduct)`) — avoids re-scoring on every request.
- Recipe ingredient recommendations sort by GreenGrade score within category — no new ML, reuses existing scores.
- Cache covers only `/api/products` (120 s TTL) and `/api/recipes` (600 s TTL) — both public, no per-user scope needed.
- Static export chosen over SSR to match Render Static Site deployment — no Node.js runtime needed for frontend.
- Docker build context set to repo root (not `./frontend`) so `generateStaticParams()` can access `backend/src/data/products.json` at build time.
