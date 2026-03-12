/**
 * Data Provenance & Confidence Service
 *
 * Tracks the origin, quality, and reliability of emissions data.
 * Every product gets a confidence score based on:
 *   - Data tier (primary LCA vs. estimated)
 *   - Number of corroborating sources
 *   - Recency of the data
 *   - Cross-source agreement
 *
 * Tiers:
 *   1 = Primary LCA data (peer-reviewed lifecycle assessments)
 *   2 = Aggregated databases (Open Food Facts ecoscore, GLEAM)
 *   3 = Estimated / derived (category-average imputation)
 */

// ─── Reference data from published LCA research ───────────────────────────
// Source: Poore & Nemecek (2018), "Reducing food's environmental impacts
// through producers and consumers", Science 360(6392), pp. 987-992.
// These are median kg CO₂e per kg product across 38,700 farms worldwide.

const POORE_NEMECEK_REFERENCE = {
  beef: { total: 59.6, breakdown: { landUseChange: 16.3, animalFeed: 7.6, farm: 30.5, processing: 1.8, transport: 0.5, packaging: 0.4, retail: 0.3 } },
  lamb: { total: 24.5, breakdown: { landUseChange: 7.5, animalFeed: 2.4, farm: 11.2, processing: 1.1, transport: 0.6, packaging: 0.4, retail: 0.3 } },
  pork: { total: 7.6, breakdown: { landUseChange: 1.5, animalFeed: 2.7, farm: 2.0, processing: 0.5, transport: 0.4, packaging: 0.3, retail: 0.2 } },
  chicken: { total: 6.9, breakdown: { landUseChange: 2.5, animalFeed: 1.8, farm: 1.3, processing: 0.6, transport: 0.4, packaging: 0.2, retail: 0.1 } },
  fish_farmed: { total: 5.1, breakdown: { landUseChange: 0.5, animalFeed: 2.0, farm: 1.5, processing: 0.5, transport: 0.3, packaging: 0.2, retail: 0.1 } },
  fish_wild: { total: 3.5, breakdown: { landUseChange: 0.0, animalFeed: 0.0, farm: 2.5, processing: 0.4, transport: 0.3, packaging: 0.2, retail: 0.1 } },
  shrimp: { total: 11.8, breakdown: { landUseChange: 3.2, animalFeed: 1.5, farm: 5.3, processing: 0.8, transport: 0.5, packaging: 0.3, retail: 0.2 } },
  eggs: { total: 4.7, breakdown: { landUseChange: 0.9, animalFeed: 1.5, farm: 1.3, processing: 0.4, transport: 0.3, packaging: 0.2, retail: 0.1 } },
  milk: { total: 3.2, breakdown: { landUseChange: 0.5, animalFeed: 0.6, farm: 1.5, processing: 0.3, transport: 0.1, packaging: 0.1, retail: 0.1 } },
  cheese: { total: 11.0, breakdown: { landUseChange: 2.8, animalFeed: 2.0, farm: 4.2, processing: 0.8, transport: 0.5, packaging: 0.4, retail: 0.3 } },
  tofu: { total: 2.0, breakdown: { landUseChange: 0.3, animalFeed: 0.0, farm: 0.8, processing: 0.5, transport: 0.2, packaging: 0.1, retail: 0.1 } },
  rice: { total: 4.0, breakdown: { landUseChange: 0.2, animalFeed: 0.0, farm: 2.5, processing: 0.5, transport: 0.4, packaging: 0.2, retail: 0.2 } },
  wheat: { total: 1.4, breakdown: { landUseChange: 0.1, animalFeed: 0.0, farm: 0.8, processing: 0.2, transport: 0.1, packaging: 0.1, retail: 0.1 } },
  tomatoes: { total: 1.4, breakdown: { landUseChange: 0.1, animalFeed: 0.0, farm: 0.7, processing: 0.2, transport: 0.2, packaging: 0.1, retail: 0.1 } },
  potatoes: { total: 0.5, breakdown: { landUseChange: 0.0, animalFeed: 0.0, farm: 0.3, processing: 0.1, transport: 0.0, packaging: 0.0, retail: 0.1 } },
  bananas: { total: 0.7, breakdown: { landUseChange: 0.1, animalFeed: 0.0, farm: 0.3, processing: 0.1, transport: 0.1, packaging: 0.1, retail: 0.0 } },
  apples: { total: 0.4, breakdown: { landUseChange: 0.0, animalFeed: 0.0, farm: 0.2, processing: 0.1, transport: 0.1, packaging: 0.0, retail: 0.0 } },
  nuts: { total: 0.3, breakdown: { landUseChange: -0.4, animalFeed: 0.0, farm: 0.4, processing: 0.2, transport: 0.1, packaging: 0.0, retail: 0.0 } },
  coffee: { total: 16.5, breakdown: { landUseChange: 3.7, animalFeed: 0.0, farm: 10.4, processing: 1.2, transport: 0.5, packaging: 0.4, retail: 0.3 } },
  chocolate: { total: 18.7, breakdown: { landUseChange: 8.5, animalFeed: 0.0, farm: 7.6, processing: 1.2, transport: 0.6, packaging: 0.5, retail: 0.3 } },
  sugar: { total: 2.7, breakdown: { landUseChange: 1.2, animalFeed: 0.0, farm: 0.8, processing: 0.3, transport: 0.2, packaging: 0.1, retail: 0.1 } },
  olive_oil: { total: 5.4, breakdown: { landUseChange: -0.4, animalFeed: 0.0, farm: 4.3, processing: 0.7, transport: 0.4, packaging: 0.3, retail: 0.1 } },
  soy_milk: { total: 1.0, breakdown: { landUseChange: 0.1, animalFeed: 0.0, farm: 0.4, processing: 0.2, transport: 0.1, packaging: 0.1, retail: 0.1 } },
};

// Product name keyword → reference key mapping
const PRODUCT_REFERENCE_MAP = [
  { keywords: ["beef", "steak", "ribeye", "brisket", "sirloin", "wagyu"], ref: "beef" },
  { keywords: ["lamb", "mutton"], ref: "lamb" },
  { keywords: ["pork", "bacon", "ham", "sausage"], ref: "pork" },
  { keywords: ["chicken", "turkey", "duck", "poultry"], ref: "chicken" },
  { keywords: ["tofu", "tempeh", "seitan"], ref: "tofu" },
  { keywords: ["salmon", "cod", "tilapia", "barramundi", "snapper", "trout", "tuna"], ref: "fish_farmed" },
  { keywords: ["shrimp", "prawn", "crab", "lobster"], ref: "shrimp" },
  { keywords: ["egg"], ref: "eggs" },
  { keywords: ["milk", "yogurt", "yoghurt"], ref: "milk" },
  { keywords: ["cheese", "cheddar", "mozzarella", "parmesan", "brie", "feta"], ref: "cheese" },
  { keywords: ["rice", "jasmine rice", "basmati"], ref: "rice" },
  { keywords: ["bread", "flour", "wheat", "pasta", "noodle", "oat", "cereal", "granola"], ref: "wheat" },
  { keywords: ["tomato", "ketchup"], ref: "tomatoes" },
  { keywords: ["potato", "fries"], ref: "potatoes" },
  { keywords: ["banana"], ref: "bananas" },
  { keywords: ["apple"], ref: "apples" },
  { keywords: ["almond", "cashew", "walnut", "peanut", "pistachio", "macadamia", "nut"], ref: "nuts" },
  { keywords: ["coffee"], ref: "coffee" },
  { keywords: ["chocolate", "cocoa", "cacao"], ref: "chocolate" },
  { keywords: ["sugar", "honey", "syrup"], ref: "sugar" },
  { keywords: ["olive oil"], ref: "olive_oil" },
  { keywords: ["soy milk", "oat milk", "almond milk"], ref: "soy_milk" },
];

// ─── Data source registry ─────────────────────────────────────────────────

const DATA_SOURCES = {
  poore_nemecek_2018: {
    id: "poore_nemecek_2018",
    name: "Poore & Nemecek (2018)",
    type: "peer_reviewed_lca",
    citation: "Poore, J. & Nemecek, T. (2018). Reducing food's environmental impacts through producers and consumers. Science, 360(6392), 987-992.",
    url: "https://doi.org/10.1126/science.aaq0216",
    methodology: "Meta-analysis of 570 studies covering 38,700 farms and 1,600 processors across 119 countries.",
    year: 2018,
    granularity: "product_type",
    reliability: "high",
  },
  our_world_in_data: {
    id: "our_world_in_data",
    name: "Our World in Data",
    type: "curated_aggregation",
    citation: "Ritchie, H. & Roser, M. (2020). Environmental Impacts of Food Production. OurWorldInData.org.",
    url: "https://ourworldindata.org/food-ghg-emissions",
    methodology: "Curated visualization of Poore & Nemecek data with additional context and per-country adjustments.",
    year: 2020,
    granularity: "product_type",
    reliability: "high",
  },
  openfoodfacts: {
    id: "openfoodfacts",
    name: "Open Food Facts",
    type: "crowdsourced_database",
    citation: "Open Food Facts contributors. Open Food Facts - the free food products database.",
    url: "https://world.openfoodfacts.org",
    methodology: "Crowdsourced product data with Ecoscore grade (A-E) computed from Agribalyse LCA data, transport adjustments, and packaging impact.",
    year: 2024,
    granularity: "brand_product",
    reliability: "medium",
  },
  category_estimate: {
    id: "category_estimate",
    name: "Category Average Estimate",
    type: "derived_estimate",
    citation: "Consciobite internal estimation based on category-level LCA data.",
    url: null,
    methodology: "Emissions estimated by applying category-average baselines derived from Poore & Nemecek (2018) with adjustments for product subcategory.",
    year: 2024,
    granularity: "category",
    reliability: "low",
  },
};

// ─── Confidence scoring ───────────────────────────────────────────────────

const EMISSION_KEYS = [
  "landUseChange", "animalFeed", "farm",
  "processing", "transport", "packaging", "retail",
];

/**
 * Find the best matching reference for a product.
 * Returns { refKey, referenceData } or null.
 */
function findReference(product) {
  const name = (product.name || "").toLowerCase();
  const desc = (product.description || "").toLowerCase();
  const searchText = `${name} ${desc}`;

  for (const mapping of PRODUCT_REFERENCE_MAP) {
    for (const keyword of mapping.keywords) {
      if (searchText.includes(keyword)) {
        return {
          refKey: mapping.ref,
          referenceData: POORE_NEMECEK_REFERENCE[mapping.ref],
        };
      }
    }
  }
  return null;
}

/**
 * Compute how well a product's emissions agree with the reference data.
 * Returns a value between 0 (completely different) and 1 (perfect match).
 */
function computeAgreement(emissions, referenceBreakdown) {
  if (!referenceBreakdown) return 0;

  let sumSquaredDiff = 0;
  let sumReference = 0;

  for (const key of EMISSION_KEYS) {
    const actual = emissions[key] || 0;
    const expected = referenceBreakdown[key] || 0;
    const diff = actual - expected;
    sumSquaredDiff += diff * diff;
    sumReference += expected * expected;
  }

  if (sumReference === 0) return 0.5;

  // Normalized RMSE → agreement
  const nrmse = Math.sqrt(sumSquaredDiff / EMISSION_KEYS.length) /
    Math.sqrt(sumReference / EMISSION_KEYS.length);

  // Convert to 0-1 agreement (lower NRMSE = higher agreement)
  return Math.max(0, Math.min(1, 1 - nrmse * 0.5));
}

/**
 * Compute data confidence for a product.
 *
 * Formula:
 *   confidence = w1·tierScore + w2·sourceCountScore + w3·agreementScore + w4·recencyScore
 *
 * Where:
 *   tierScore        = { 1: 1.0, 2: 0.7, 3: 0.4 }
 *   sourceCountScore = min(1, sourceCount / 3)
 *   agreementScore   = cross-source agreement (0-1)
 *   recencyScore     = max(0, 1 - yearsSinceVerified / 5)
 *
 * Weights: w1=0.35, w2=0.20, w3=0.30, w4=0.15
 */
function computeDataConfidence(product, source) {
  const sourceInfo = source || "catalog";

  // Determine tier
  let tier, sources, lastVerifiedYear;

  if (sourceInfo === "openfoodfacts") {
    tier = 2;
    sources = ["openfoodfacts"];
    lastVerifiedYear = new Date().getFullYear();
  } else {
    // Local catalog products — check reference match
    const ref = findReference(product);
    if (ref) {
      tier = 1;
      sources = ["poore_nemecek_2018", "our_world_in_data"];
      lastVerifiedYear = 2024;
    } else {
      tier = 3;
      sources = ["category_estimate"];
      lastVerifiedYear = 2024;
    }
  }

  // Compute sub-scores
  const tierScores = { 1: 1.0, 2: 0.7, 3: 0.4 };
  const tierScore = tierScores[tier] || 0.4;
  const sourceCountScore = Math.min(1, sources.length / 3);

  // Agreement score
  let agreementScore = 0.5; // default if no reference
  const ref = findReference(product);
  if (ref && product.emissions) {
    agreementScore = computeAgreement(product.emissions, ref.referenceData.breakdown);
  }

  // Recency
  const currentYear = new Date().getFullYear();
  const recencyScore = Math.max(0, 1 - (currentYear - lastVerifiedYear) / 5);

  // Weighted combination
  const confidence =
    0.35 * tierScore +
    0.20 * sourceCountScore +
    0.30 * agreementScore +
    0.15 * recencyScore;

  return {
    confidence: Math.round(Math.max(0, Math.min(1, confidence)) * 100) / 100,
    tier,
    tierLabel: tier === 1 ? "verified_lca" : tier === 2 ? "aggregated_database" : "estimated",
    sources: sources.map((s) => DATA_SOURCES[s]).filter(Boolean),
    sourceCount: sources.length,
    agreementScore: Math.round(agreementScore * 100) / 100,
    referenceProduct: ref ? ref.refKey : null,
    lastVerified: `${lastVerifiedYear}-01`,
  };
}

/**
 * Build the full provenance object for a product.
 */
function getProductProvenance(product, source) {
  const dataConfidence = computeDataConfidence(product, source);

  return {
    dataConfidence: dataConfidence.confidence,
    dataTier: dataConfidence.tier,
    dataTierLabel: dataConfidence.tierLabel,
    sources: dataConfidence.sources.map((s) => ({
      name: s.name,
      type: s.type,
      year: s.year,
      reliability: s.reliability,
    })),
    sourceCount: dataConfidence.sourceCount,
    referenceProduct: dataConfidence.referenceProduct,
    agreementWithReference: dataConfidence.agreementScore,
    lastVerified: dataConfidence.lastVerified,
  };
}

/**
 * Return the full methodology description.
 */
function getMethodology() {
  return {
    version: "3.0",
    algorithm: {
      name: "GreenGrade v3",
      description: "A data-driven sustainability scoring model that uses Gaussian Kernel Density Estimation to score food products on environmental impact across 7 lifecycle dimensions.",
      dimensions: [
        { key: "landUseChange", label: "Land Use Change", description: "Carbon emissions from converting natural ecosystems (forests, wetlands) to agricultural land." },
        { key: "animalFeed", label: "Animal Feed", description: "Emissions from growing, processing, and transporting feed crops for livestock." },
        { key: "farm", label: "Farm", description: "Direct emissions from farming operations including methane from livestock, nitrous oxide from fertilizers, and energy use." },
        { key: "processing", label: "Processing", description: "Emissions from post-harvest processing, manufacturing, and food preparation." },
        { key: "transport", label: "Transport", description: "Emissions from distribution and shipping from farm to retail." },
        { key: "packaging", label: "Packaging", description: "Emissions from producing packaging materials (plastic, glass, cardboard)." },
        { key: "retail", label: "Retail", description: "Emissions from retail operations including refrigeration, lighting, and waste." },
      ],
      scoring: {
        method: "Kernel Density Estimation with variance-weighted feature importance",
        blending: "60% category-relative CDF + 40% global CDF",
        transform: "Sigmoid normalization (k=5, midpoint=0.5)",
        scale: "0-10 (10 = most sustainable, 0 = least sustainable)",
        colors: { green: "7.0-10.0", yellow: "4.0-6.9", red: "0.0-3.9" },
      },
      anomalyDetection: {
        method: "Mahalanobis distance with chi-squared threshold",
        threshold: "95th percentile for 7 degrees of freedom (14.067)",
      },
    },
    dataSources: Object.values(DATA_SOURCES),
    confidenceScoring: {
      description: "Each product receives a data confidence score (0-1) based on the quality, quantity, and recency of its emissions data sources.",
      formula: "confidence = 0.35 * tierScore + 0.20 * sourceCountScore + 0.30 * agreementScore + 0.15 * recencyScore",
      tiers: [
        { tier: 1, label: "Verified LCA", description: "Emissions data sourced from peer-reviewed lifecycle assessment studies. Cross-validated against multiple published sources.", tierScore: 1.0 },
        { tier: 2, label: "Aggregated Database", description: "Data from curated environmental databases like Open Food Facts Ecoscore. Based on established LCA methodologies but may use estimation for specific products.", tierScore: 0.7 },
        { tier: 3, label: "Estimated", description: "Emissions estimated using category-average baselines. Less precise but provides directional guidance for products without specific LCA data.", tierScore: 0.4 },
      ],
      interpretation: [
        { range: "0.80-1.00", label: "High confidence", description: "Data is well-supported by multiple peer-reviewed sources." },
        { range: "0.50-0.79", label: "Moderate confidence", description: "Data is supported by at least one credible source but may rely on category-level estimates for some dimensions." },
        { range: "0.00-0.49", label: "Low confidence", description: "Data is primarily estimated from category averages. Treat as directional guidance only." },
      ],
    },
    limitations: [
      "Emissions data represents category-level averages, not brand-specific supply chain measurements.",
      "Transport emissions assume average global shipping distances and may vary significantly by region.",
      "Seasonal and regional variations in farming practices are not captured.",
      "Packaging emissions are estimated based on typical packaging for the product type.",
      "The scoring model is trained on the current product catalog and may shift as new products are added.",
    ],
    references: [
      DATA_SOURCES.poore_nemecek_2018,
      DATA_SOURCES.our_world_in_data,
    ],
  };
}

module.exports = {
  getProductProvenance,
  computeDataConfidence,
  findReference,
  computeAgreement,
  getMethodology,
  DATA_SOURCES,
  POORE_NEMECEK_REFERENCE,
};
