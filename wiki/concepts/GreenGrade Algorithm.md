# GreenGrade Algorithm

The core sustainability scoring system that rates food products on a 0-10 scale across 7 supply-chain dimensions.

## 7 Emission Categories
1. **Land Use Change** — Deforestation and land conversion impact
2. **Animal Feed** — Feed production emissions
3. **Farm** — On-farm emissions (methane, fertilizers)
4. **Processing** — Manufacturing and processing
5. **Transport** — Distribution logistics
6. **Packaging** — Material and waste impact
7. **Retail** — Store-level emissions

## Scoring Pipeline

```
Raw Emissions Data
    │
    ▼
Statistical Normalization (Gaussian KDE)
    │
    ▼
Variance-Based Feature Importance Weighting
    │
    ▼
Sigmoid Scoring (mapped to 0-10 scale)
    │
    ▼
Anomaly Detection (Mahalanobis Distance)
    │
    ▼
Final GreenGrade Score + Color
```

## Key Functions (Community 1 in [[Graphify]])
- `calculateGreenGrade()` — Main scoring entry point
- `buildKdeStats()` — Kernel density estimation
- `computeStats()` — Statistical aggregation
- `computeCentroid()` / `computeCovarianceInverse()` — Anomaly detection
- `fallbackScore()` — Fallback when data is insufficient
- `getColor()` — Maps score to green/yellow/red

## Data Confidence

Scores include a confidence rating based on [[Data Provenance]]:
- **High (≥80%)**: Verified LCA data (Tier 1)
- **Moderate (50-79%)**: Aggregated database (Tier 2)
- **Low (<50%)**: Estimated (Tier 3)

## Cross-References
- [[System Overview]]
- [[Data Provenance]]
- [[safeFetch]]
