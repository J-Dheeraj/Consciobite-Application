# Data Provenance

Multi-tier system for tracking the origin and confidence of emissions data used in [[GreenGrade Algorithm]] scoring.

## Confidence Tiers

| Tier | Label | Confidence | Source Type |
|------|-------|-----------|-------------|
| 1 | Verified LCA Data | ≥80% | Peer-reviewed lifecycle assessments |
| 2 | Aggregated Database | 50-79% | Multi-source aggregated data |
| 3 | Estimated | <50% | Proxy estimates and extrapolations |

## Key Functions (Community 7 in [[Graphify]])
- `computeDataConfidence()` — Calculates confidence score
- `findReference()` — Locates reference product for comparison
- `computeAgreement()` — Measures alignment with reference data
- `getProductProvenance()` — Full provenance chain for a product

## External Data Integration (Community 8)
- `lookupOpenFoodFacts()` — Fetches data from Open Food Facts API
- `enrichProduct()` — Enriches product with external data
- `estimateEmissions()` — Estimates missing emission values
- `mapOpenFoodFactsCategory()` — Maps external categories to internal taxonomy

## Display
Product detail pages show:
- Confidence badge (color-coded)
- Data tier label
- Reference product
- Agreement percentage
- Source count and citations
- Last verified date

## Cross-References
- [[GreenGrade Algorithm]]
- [[System Overview]]
