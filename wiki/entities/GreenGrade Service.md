---
type: entity
title: "GreenGrade Service"
created: 2026-04-25
updated: 2026-06-25
status: mature
tags: [service, ml, backend, greengrade]
related: ["[[GreenGrade KDE Scoring]]", "[[Product Catalog Schema]]", "[[Open Food Facts Integration]]", "[[Digital Product Passport API]]"]
sources: ["[[.raw/graphify-audit-2026-04-25.md]]", "METHODOLOGY.md"]
---

# GreenGrade Service

`backend/src/services/greengrade.js`

Central ML service. Exposes two functions used across the backend.

## Functions

### `trainModel(products)`
Called once at startup (`src/index.js`). Fits KDE and covariance matrices on the full product catalog. Must be called before `calculateGreenGrade()`.

### `calculateGreenGrade(emissions, category, product?)`
Scores a single product. Returns:
```js
{
  score: 0–10,
  color: "#hex",
  breakdown: [{ category, categoryScore, emission, maxReference }],
  totalEmissions: number,
  percentile: 0–1,
  confidence: 0–1,
  anomaly: { isAnomaly: bool, distance: number },
  dataTier, dataConfidence, referenceProduct, sources, ...
}
```

## Callers

| File | Use |
|------|-----|
| `routes/products.js` | `enrichProduct()` calls it for every product |
| `routes/recipes.js` | `getGreenIngredients()` — sorts by score to recommend ingredients |
| `routes/passport.js` | `buildPassport()` wraps it for B2B reporting — see [[Digital Product Passport API]] |

## Algorithm version & spec

As of 2026-06-07 this is **GreenGrade v3.0**, documented end-to-end in `METHODOLOGY.md` (root): Gaussian KDE per emission dimension (global + per-category), Silverman's-rule bandwidth selection, 60/40 category/global CDF blending, Abramowitz & Stegun normal-CDF approximation. `methodology_version: "3.0"` is exposed verbatim in passport API responses.

## Unknown Category Fallback

If `category` is not one of the 9 known values, the scoring falls back to `"Pantry"` baselines. This prevents throws in `getGreenIngredients()` when Open Food Facts products have unmapped categories.
