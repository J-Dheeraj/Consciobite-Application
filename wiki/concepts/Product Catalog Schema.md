---
type: concept
title: "Product Catalog Schema"
created: 2026-04-25
updated: 2026-04-25
status: mature
tags: [products, schema, data, backend]
related: ["[[GreenGrade KDE Scoring]]", "[[GreenGrade Service]]", "[[Open Food Facts Integration]]"]
sources: ["[[.raw/graphify-audit-2026-04-25.md]]"]
---

# Product Catalog Schema

`backend/src/data/products.json` — static 550-product catalog loaded at startup.

## Required Fields (enforced by startup validation)

```json
{
  "id": "string",
  "name": "string",
  "category": "string",
  "brand": "string",
  "description": "string",
  "emissions": {
    "landUseChange": 0.0,
    "animalFeed":    0.0,
    "farm":          0.0,
    "processing":    0.0,
    "transport":     0.0,
    "packaging":     0.0,
    "retail":        0.0
  }
}
```

## Optional Fields

- `barcode` — enables barcode scan lookup
- `dataSources` — brand info, emissions citations, methodology
- `dataConfidence` — 0–1 float
- `dataTier` — 1 (Verified LCA), 2 (Aggregated DB), 3 (Estimated)
- `purchaseLinks[]` — rendered as "Click to Buy" on ProductDetail

## Categories

`Protein` · `Seafood` · `Dairy & Eggs` · `Grains` · `Fruits` · `Vegetables` · `Beverages` · `Snacks` · `Pantry`

## Startup Validation (commit 8d50d17)

`validateProductCatalog()` runs in `src/index.js` before `trainModel()`. Throws on the first invalid entry with a descriptive message including the product ID. Prevents silently-degraded GreenGrade model trained on malformed data.

## Loading Chain

```
src/index.js
  └─ require("./data/products.json")
  └─ validateProductCatalog(products)   ← added commit 8d50d17
  └─ trainModel(products)               ← GreenGrade KDE training

src/routes/products.js
  └─ require("../data/products.json")
  └─ enrichedProducts = products.map(enrichProduct)  ← pre-computed at module load
```
