# GreenGrade Algorithm -- Technical Specification

| Field              | Value                                                    |
|--------------------|----------------------------------------------------------|
| Algorithm          | GreenGrade v3.0                                          |
| Specification date | 2026-06-07                                               |
| Catalog coverage   | 550 SKUs across 9 food categories                        |
| Score range        | 0.0 -- 10.0 (10 = most sustainable)                     |
| Implementation     | `backend/src/services/greengrade.js`                     |
| Provenance service | `backend/src/services/dataProvenance.js`                 |

---

## 1. Scope

GreenGrade scores the environmental footprint of food products on a 0--10 scale. Each product's greenhouse gas emissions are decomposed into 7 supply-chain categories, measured in kg CO2e per kg of product. The score reflects how a product performs relative to both its category peers and the full catalog, not against an arbitrary absolute threshold.

---

## 2. Emission categories

All emissions are expressed in **kg CO2e per kg product**.

| # | Key             | Label            | Description                                                            |
|---|-----------------|------------------|------------------------------------------------------------------------|
| 1 | `landUseChange` | Land Use Change  | Carbon from converting natural ecosystems to agricultural land         |
| 2 | `animalFeed`    | Animal Feed      | Growing, processing, and transporting livestock feed                   |
| 3 | `farm`          | Farm Operations  | Direct farming: methane from livestock, N2O from fertilizers, energy   |
| 4 | `processing`    | Processing       | Post-harvest manufacturing and food preparation                       |
| 5 | `transport`     | Transport        | Distribution from farm to retail                                       |
| 6 | `packaging`     | Packaging        | Production of packaging materials                                      |
| 7 | `retail`        | Retail           | Retail operations: refrigeration, lighting, waste                      |

---

## 3. Scoring pipeline

The scoring pipeline runs at query time after a one-time training phase that fits KDE models to the product catalog.

### 3.1 Training phase (startup)

On server initialization, `trainModel()` ingests the full product catalog and builds:

- **Per-dimension KDE models** -- one global model and one per-category model for each of the 7 emission keys, plus total emissions.
- **Variance-based feature weights** -- determines which emission dimensions carry the most discriminative power.
- **Per-category covariance matrices** -- used for anomaly detection.

### 3.2 Kernel Density Estimation

Gaussian KDE replaces raw percentile lookup with smooth probability density estimates. This handles sparse tails and clustered centers better than sorted-array ranks.

**Bandwidth selection** (Silverman's rule of thumb):

```
h = 1.06 * min(sigma, IQR / 1.34) * n^(-0.2)
```

where `sigma` is the standard deviation, `IQR` is the interquartile range, and `n` is the sample count. Bandwidth is floored at 0.001 to prevent degenerate zero-bandwidth cases.

**CDF evaluation** at query point `x`:

```
CDF(x) = (1/n) * sum_i[ phi((x - x_i) / h) ]
```

where `phi` is the standard normal CDF. The result is clamped to [0.001, 0.999] to avoid exact 0 or 1.

**Normal CDF approximation**: Abramowitz & Stegun formula 26.2.17 using the upper-tail polynomial approximation with `p = 0.2316419`. Maximum error < 7.5e-8.

### 3.3 Category/global blending

Each dimension score blends two CDF evaluations:

```
blended_cdf = 0.6 * category_cdf + 0.4 * global_cdf
```

This matters because absolute emission levels vary enormously across food categories. A beef product at 15 kg CO2e/kg is efficient for beef (median ~60 kg CO2e/kg) but high relative to the full catalog. The 60/40 blend gives category context the dominant weight while still anchoring products against the global distribution.

If no category-level model is available, the global CDF is used at 100%.

### 3.4 Variance-based feature importance

Emission dimensions with more spread carry more weight because they better discriminate sustainable from harmful products.

```
raw_importance = 0.7 * CV + 0.3 * (range / mean)
```

where `CV` is the coefficient of variation (`std / mean`), and `range` is `p95 - min`. Each raw importance value is floored at 0.01, then all values are normalized to sum to 1.0. These become the feature weights for the final weighted aggregate.

### 3.5 Non-linear sigmoid transform

The blended CDF percentile (inverted, so lower emissions = higher score) is passed through a sigmoid:

```
sigmoid(x) = 1 / (1 + exp(-5 * (x - 0.5)))
```

This function is rescaled to map [0, 1] to [0, 10]. It compresses the tails and expands the middle, giving better score resolution where most products cluster.

### 3.6 Final score computation

```
score = clamp(sum_d[ sigmoid(1 - blended_cdf_d) * weight_d ], 0, 10)
```

The weighted sum of per-dimension sigmoid scores is clamped to [0, 10] and rounded to one decimal place.

---

## 4. Color thresholds

| Color  | Score range | Interpretation                           |
|--------|-------------|------------------------------------------|
| Green  | 7.0 -- 10.0 | Low environmental impact                 |
| Yellow | 4.0 -- 6.9  | Moderate environmental impact            |
| Red    | 0.0 -- 3.9  | High environmental impact                |

---

## 5. Anomaly detection

Products with unusual emission profiles relative to their category are flagged using Mahalanobis distance.

### 5.1 Method

1. Compute the category centroid (mean vector) across all 7 emission dimensions.
2. Compute the full 7x7 covariance matrix for the category.
3. Apply Tikhonov regularization (`lambda = 1e-6`) on the diagonal to guarantee invertibility when some dimensions have zero or near-zero variance.
4. Invert the covariance matrix using Gauss-Jordan elimination with partial pivoting. Singularity is detected at a tolerance of `1e-12`.
5. Compute the squared Mahalanobis distance: `D^2 = (x - mu)^T * Sigma^(-1) * (x - mu)`.

### 5.2 Threshold

The chi-squared 95th percentile for 7 degrees of freedom: **14.067**.

Products with `D^2 > 14.067` are flagged as anomalous. The API response includes the distance value and the threshold for transparency.

### 5.3 Minimum sample requirement

Covariance inversion requires at least `d + 1 = 8` samples per category. Categories with fewer samples skip anomaly detection.

---

## 6. Data provenance and confidence scoring

Every product receives a data confidence score between 0 and 1, reflecting the quality, quantity, and recency of its underlying emissions data.

### 6.1 Data tiers

| Tier | Label              | Description                                                                                    | Score weight |
|------|--------------------|------------------------------------------------------------------------------------------------|--------------|
| 1    | Verified LCA       | Peer-reviewed lifecycle assessment data, cross-validated against multiple published sources     | 1.0          |
| 2    | Aggregated Database | Curated databases such as Open Food Facts Ecoscore, based on established LCA methodologies     | 0.7          |
| 3    | Estimated          | Category-average baselines derived from Poore & Nemecek (2018)                                 | 0.4          |

### 6.2 Confidence formula

```
confidence = 0.35 * tierScore + 0.20 * sourceCountScore + 0.30 * agreementScore + 0.15 * recencyScore
```

| Component          | Calculation                                        | Range   |
|--------------------|----------------------------------------------------|---------|
| `tierScore`        | Tier lookup: {1: 1.0, 2: 0.7, 3: 0.4}             | 0 -- 1  |
| `sourceCountScore` | `min(1, sourceCount / 3)`                          | 0 -- 1  |
| `agreementScore`   | Cross-source agreement via normalized RMSE (see 6.3) | 0 -- 1  |
| `recencyScore`     | `max(0, 1 - yearsSinceVerified / 5)`               | 0 -- 1  |

### 6.3 Cross-source agreement

Agreement between a product's emissions and the closest reference entry from the Poore & Nemecek dataset is computed as:

```
nrmse = sqrt(mean((actual_d - expected_d)^2)) / sqrt(mean(expected_d^2))
agreement = clamp(1 - nrmse * 0.5, 0, 1)
```

Products with no matching reference receive a default agreement score of 0.5.

### 6.4 Confidence interpretation

| Range       | Label               | Interpretation                                                      |
|-------------|----------------------|---------------------------------------------------------------------|
| 0.80 -- 1.00 | High confidence     | Well-supported by multiple peer-reviewed sources                    |
| 0.50 -- 0.79 | Moderate confidence | At least one credible source; may rely on category-level estimates  |
| 0.00 -- 0.49 | Low confidence      | Primarily estimated from category averages; treat as directional    |

---

## 7. Data sources

| Source                  | Type                   | Coverage                                                     | Year |
|-------------------------|------------------------|--------------------------------------------------------------|------|
| Poore & Nemecek (2018)  | Peer-reviewed LCA      | Meta-analysis of 570 studies, 38,700 farms, 119 countries    | 2018 |
| Our World in Data       | Curated aggregation    | Visualization of Poore & Nemecek with per-country adjustments | 2020 |
| Open Food Facts         | Crowdsourced database  | Ecoscore grade (A--E) from Agribalyse LCA data              | 2024 |
| ADEME Agribalyse        | National LCA database  | French government lifecycle assessment database               | 2024 |

**Primary reference**: Poore, J. & Nemecek, T. (2018). "Reducing food's environmental impacts through producers and consumers." *Science*, 360(6392), 987--992. DOI: [10.1126/science.aaq0216](https://doi.org/10.1126/science.aaq0216)

---

## 8. Product catalog

550 products across 9 categories:

| Category      | SKU count |
|---------------|-----------|
| Beverages     | 59        |
| Dairy & Eggs  | 70        |
| Fruits        | 48        |
| Grains        | 56        |
| Pantry        | 99        |
| Protein       | 53        |
| Seafood       | 46        |
| Snacks        | 73        |
| Vegetables    | 46        |

---

## 9. Known limitations

1. Emissions data represents category-level averages, not brand-specific supply chain measurements.
2. Transport emissions assume average global shipping distances and vary significantly by region.
3. Seasonal and regional variations in farming practices are not captured.
4. Packaging emissions are estimated based on typical packaging for the product type.
5. The KDE model is trained on the current product catalog. Score distributions shift as products are added or removed.
6. In-memory model state does not persist across server restarts; the model retrains from the product catalog on each startup.

---

## 10. API reference

Scoring data is available through the following endpoints:

| Endpoint                         | Returns                                                        |
|----------------------------------|----------------------------------------------------------------|
| `GET /api/products/:id`          | Full GreenGrade breakdown including score, percentile, anomaly |
| `GET /api/products/compare?ids=` | Side-by-side comparison of multiple products                   |
| `GET /api/methodology`           | Machine-readable version of this specification                 |

Each product response includes:

```json
{
  "score": 7.2,
  "color": "green",
  "totalEmissions": 1.7,
  "breakdown": [
    {
      "category": "Land Use Change",
      "emission": 0.3,
      "maxReference": 8.5,
      "categoryScore": 8.1,
      "percentile": 81
    }
  ],
  "confidence": 0.85,
  "percentile": 78,
  "categoryRank": 62,
  "anomaly": {
    "isAnomaly": false,
    "distance": 1.23,
    "threshold": 3.75
  },
  "dataConfidence": 0.82,
  "dataTier": 1,
  "dataTierLabel": "verified_lca",
  "sources": [
    { "name": "Poore & Nemecek (2018)", "type": "peer_reviewed_lca", "year": 2018, "reliability": "high" }
  ]
}
```

---

## 11. Version history

| Version | Date       | Changes                                                                                 |
|---------|------------|-----------------------------------------------------------------------------------------|
| v1.0    | --         | Linear scoring against fixed emission maximums                                           |
| v3.0    | 2026-06-07 | Gaussian KDE scoring, variance-weighted features, category/global blending, Mahalanobis anomaly detection, data provenance and confidence tiers |

---

## 12. Contact

For technical questions about the scoring methodology, data sources, or API integration, contact the maintainers through the [GitHub repository](https://github.com/J-Dheeraj/Consciobite-Application).
