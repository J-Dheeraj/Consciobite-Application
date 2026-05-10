---
type: overview
title: "Consciobite Architecture Overview"
created: 2026-04-25
updated: 2026-04-25
status: developing
tags: [architecture, overview, consciobite]
related: ["[[GreenGrade Service]]", "[[GreenGrade KDE Scoring]]", "[[Product Catalog Schema]]", "[[Auth-Expired Event Bus]]", "[[RequireAuth Guard]]"]
sources: ["[[.raw/graphify-audit-2026-04-25.md]]"]
---

# Consciobite Architecture Overview

Food sustainability app. Rates grocery products using GreenGrade (A–F, 1–10 score) based on lifecycle carbon emissions.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 SPA, React Router v6, TanStack React Query |
| Backend | Node.js, Express, SQLite (better-sqlite3) |
| Auth | JWT HS256, account lockout |
| ML | Custom KDE + sigmoid scoring (greengrade.js) |
| External | Open Food Facts API (barcode fallback) |
| Infra | Render.com, CI with Prettier + ESLint |

## Directory Structure

```
Consciobite-Application/
├── frontend/src/
│   ├── pages/          — CarbonTracker, ProductDetail, Compare, Recipes, Tips …
│   ├── components/     — ReviewSection, GradeBadge, Navbar …
│   ├── context/        — AuthContext, ThemeContext
│   ├── services/       — api.js (safeFetch wrapper)
│   └── utils/          — constants.js, favorites.js, pageStyles.js
├── backend/src/
│   ├── routes/         — products, auth, reviews, carbon, recipes
│   ├── middleware/     — auth, validate, cache, logger
│   ├── services/       — greengrade.js, dataProvenance.js
│   ├── data/           — products.json (550 products)
│   └── db/             — schema.js (SQLite init)
└── wiki/               — this knowledge base
```

## Key Data Flows

**Product scoring:**
`products.json` → `trainModel()` → per-request `calculateGreenGrade()` → `enrichProduct()` → API response

**Barcode scan:**
`GET /api/products/scan/:barcode` → local catalog → OpenFoodFacts fallback → `enrichProduct()`

**Carbon logging:**
`POST /api/carbon/log` (auth required, validate()) → SQLite `carbon_logs` table

**Auto-logout:**
401 from any API call → `safeFetch()` fires `AUTH_EXPIRED_EVENT` → `AuthContext` clears state + localStorage

## Decisions of Note

- Products are pre-enriched at module load (`enrichedProducts = products.map(enrichProduct)`) — avoids re-scoring on every request.
- Recipe ingredient recommendations sort by GreenGrade score within category — no new ML, reuses existing scores.
- Cache covers only `/api/products` (120 s TTL) and `/api/recipes` (600 s TTL) — both public, no per-user scope needed.
