---
type: concept
title: "GreenGrade KDE Scoring"
created: 2026-04-25
updated: 2026-06-08
status: mature
tags: [greengrade, ml, scoring, emissions]
related: ["[[GreenGrade Service]]", "[[Product Catalog Schema]]", "[[Consciobite Architecture Overview]]", "[[Digital Product Passport API]]"]
sources: ["[[.raw/graphify-audit-2026-04-25.md]]", "[[Digital Product Passport API 2026-06-08]]"]
---

# GreenGrade KDE Scoring

GreenGrade v3 is the ML scoring algorithm that rates every product A–F (1–10 scale) based on lifecycle carbon emissions.

## Algorithm

1. **Input:** 7 emission dimensions per product — `landUseChange`, `animalFeed`, `farm`, `processing`, `transport`, `packaging`, `retail` (all in kg CO₂e/kg).

2. **KDE (Kernel Density Estimation):** For each dimension, a KDE is fitted across all products in the catalog. Each product's raw emission value is converted to a percentile within its category-peer distribution.

3. **Sigmoid score transform:** Percentile → score (0–10) via sigmoid so extreme outliers don't dominate.

4. **Tikhonov regularisation:** Applied to the covariance matrix used in anomaly detection to prevent near-singular matrices on small categories.

5. **Mahalanobis distance:** Detects anomalous products whose emission profiles are unlikely given the category distribution. High distance = flagged as anomaly in UI.

6. **Category rank:** Each product scored within its category (`Protein`, `Seafood`, `Dairy & Eggs`, `Grains`, `Fruits`, `Vegetables`, `Beverages`, `Snacks`, `Pantry`).

## Data Provenance

Products carry `dataConfidence` (0–1), `dataTier` (1=Verified LCA, 2=Aggregated Database, 3=Estimated), `referenceProduct`, and `sources[]`. Shown in "Stats for Nerds" on ProductDetail.

## Startup Validation (added commit 8d50d17)

`products.json` is validated at server startup before `trainModel()` is called:
- Every entry must have `id`, `name`, `category`
- `emissions` must be an object with all 7 dimension keys as numbers
- Malformed entries throw immediately, preventing a silently-degraded model

## Open Food Facts Products

Products scanned by barcode and not found locally get emission estimates from `estimateEmissions(ecoGrade, category)` which maps Ecoscore grades (A–E) to multipliers (0.4–1.4) applied to category baselines. These carry lower data confidence.

## Formal Specification (2026-06-08)

The informal description above is now backed by a full written spec at repo-root `METHODOLOGY.md` ("GreenGrade v3.0"), including the exact Silverman bandwidth formula, the 60/40 category/global CDF blend, and the Abramowitz & Stegun normal-CDF approximation. Every response from the new [[Digital Product Passport API]] carries `methodology_version: "3.0"`, tying external-facing scores to this document.
