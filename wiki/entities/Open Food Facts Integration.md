---
type: entity
title: "Open Food Facts Integration"
created: 2026-04-25
updated: 2026-04-25
status: mature
tags: [external-api, barcode, products, backend]
related: ["[[Product Catalog Schema]]", "[[GreenGrade KDE Scoring]]", "[[Backend Security]]"]
sources: ["[[.raw/graphify-audit-2026-04-25.md]]"]
---

# Open Food Facts Integration

`backend/src/routes/products.js` — `lookupOpenFoodFacts(barcode)`

Fallback data source for barcode scans not found in the local product catalog.

## Flow

1. `GET /api/products/scan/:barcode` checks local catalog first.
2. If not found, calls `lookupOpenFoodFacts(barcode)`.
3. Constructs a synthetic product with `id: "off_<barcode>"` and estimated emissions.
4. Product IDs prefixed `off_` are also handled by `GET /api/products/:id`.

## Timeout

`OPEN_FOOD_FACTS_TIMEOUT_MS = 10_000` (10 s). Uses `AbortController`.

## Emission Estimation

`estimateEmissions(ecoGrade, category)` maps Ecoscore grades A–E to multipliers (0.4–1.4) applied against category baseline values. Grade `c` is the default if unknown.

## Error Handling

`lookupOpenFoodFacts()` has an internal try/catch and returns `null` on any failure (network error, bad data, timeout). The calling handlers (`/:id`, `/scan/:barcode`) added outer try/catch in commit 8d50d17 to forward unexpected errors to the global Express error handler.

## Test Environment

Calls are skipped when `NODE_ENV === "test"` — returns `null` immediately for deterministic test results.
