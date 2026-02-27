/**
 * GreenGrade ML Algorithm v2
 *
 * A data-driven sustainability scoring model that learns emission distributions
 * from the product catalog at startup, then scores each product using:
 *
 *   1. Variance-based feature importance  – dimensions with more spread carry
 *      more weight because they better discriminate sustainable vs. harmful.
 *   2. Category-aware percentile scoring  – a product is scored relative to
 *      its food category (protein, vegetables, …) AND globally, then blended.
 *   3. Non-linear sigmoid transform       – compresses the tails and expands
 *      the middle, giving better resolution where most products cluster.
 *   4. Confidence signal                  – reports how many category peers
 *      the model trained on, so the UI can flag thin-data estimates.
 *
 * Output is fully backward-compatible: { score, color, totalEmissions, breakdown }
 * with optional new fields: confidence, percentile, categoryRank.
 *
 * Score 10 = most sustainable, 0 = least sustainable.
 * Color: green (7-10), yellow (4-6.9), red (0-3.9)
 */

const EMISSION_KEYS = [
  "landUseChange",
  "animalFeed",
  "farm",
  "processing",
  "transport",
  "packaging",
  "retail",
];

const CATEGORY_LABELS = {
  landUseChange: "Land Use Change",
  animalFeed: "Animal Feed",
  farm: "Farm",
  processing: "Processing",
  transport: "Transport",
  packaging: "Packaging",
  retail: "Retail",
};

// Fallback maximums used when no training data is available (e.g. unit tests
// that call calculateGreenGrade without training first).
const FALLBACK_MAX = {
  landUseChange: 12.0,
  animalFeed: 8.0,
  farm: 25.0,
  processing: 3.0,
  transport: 2.0,
  packaging: 1.5,
  retail: 1.0,
};

// ─── Learned model state (populated by trainModel) ──────────────────────────

let trained = false;

// Global statistics per emission dimension
let globalStats = {}; // { key: { mean, std, p25, p50, p75, p95, sorted } }

// Per food-category statistics
let categoryStats = {}; // { "Protein": { key: { mean, std, p25, … }, sampleCount } }

// Importance weights per emission dimension (higher = more discriminative)
let featureWeights = {}; // { key: weight }  – sums to 1.0

// ─── Training (called once at startup) ──────────────────────────────────────

function trainModel(products) {
  if (!products || products.length === 0) return;

  // Collect raw emission vectors
  const vectors = products
    .filter((p) => p.emissions)
    .map((p) => ({ category: p.category, emissions: p.emissions }));

  if (vectors.length === 0) return;

  // --- Global stats ---
  globalStats = {};
  for (const key of EMISSION_KEYS) {
    const vals = vectors.map((v) => v.emissions[key] || 0);
    globalStats[key] = computeStats(vals);
  }

  // --- Per-category stats ---
  categoryStats = {};
  const grouped = {};
  for (const v of vectors) {
    const cat = v.category || "Unknown";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(v.emissions);
  }

  for (const [cat, emissionsList] of Object.entries(grouped)) {
    categoryStats[cat] = { sampleCount: emissionsList.length };
    for (const key of EMISSION_KEYS) {
      const vals = emissionsList.map((e) => e[key] || 0);
      categoryStats[cat][key] = computeStats(vals);
    }
    // Total emissions per category
    const totals = emissionsList.map((e) => EMISSION_KEYS.reduce((s, k) => s + (e[k] || 0), 0));
    categoryStats[cat]._totals = computeStats(totals);
  }

  // Global total emissions stats
  const globalTotals = vectors.map((v) =>
    EMISSION_KEYS.reduce((s, k) => s + (v.emissions[k] || 0), 0)
  );
  globalStats._totals = computeStats(globalTotals);

  // --- Feature importance via coefficient of variation ---
  // Dimensions with higher relative spread are more informative for
  // distinguishing sustainable from unsustainable products.
  const rawImportance = {};
  let importanceSum = 0;
  for (const key of EMISSION_KEYS) {
    const s = globalStats[key];
    // Coefficient of variation, floored to avoid zero-division.
    // Add a small weight for range to credit dimensions with wide absolute span.
    const cv = s.mean > 0.001 ? s.std / s.mean : 0;
    const range = s.p95 - (s.sorted[0] || 0);
    const importance = cv * 0.7 + (range / (s.mean || 1)) * 0.3;
    rawImportance[key] = Math.max(importance, 0.01); // floor
    importanceSum += rawImportance[key];
  }

  featureWeights = {};
  for (const key of EMISSION_KEYS) {
    featureWeights[key] = rawImportance[key] / importanceSum;
  }

  trained = true;
}

// ─── Scoring ────────────────────────────────────────────────────────────────

function calculateGreenGrade(emissions, productCategory) {
  const totalEmissions =
    Math.round(EMISSION_KEYS.reduce((sum, k) => sum + (emissions[k] || 0), 0) * 100) / 100;

  let breakdown;
  let score;
  let confidence = 1.0;
  let percentile = null;
  let categoryRank = null;

  if (!trained) {
    // Fallback: behave like v1 so unit tests without training still work
    const result = fallbackScore(emissions);
    return {
      ...result,
      totalEmissions,
    };
  }

  // --- Per-dimension scoring ---
  breakdown = EMISSION_KEYS.map((key) => {
    const value = emissions[key] || 0;
    const gStats = globalStats[key];
    const cStats =
      productCategory && categoryStats[productCategory]
        ? categoryStats[productCategory][key]
        : null;

    // Global percentile (0 = lowest emitter, 1 = highest)
    const globalPct = percentileRank(gStats.sorted, value);

    // Category percentile (if available)
    const catPct = cStats ? percentileRank(cStats.sorted, value) : globalPct;

    // Blend: 60% category-relative, 40% global (category context matters more)
    const blendedPct = cStats ? catPct * 0.6 + globalPct * 0.4 : globalPct;

    // Non-linear sigmoid transform: maps percentile to 0-10 score.
    // Lower percentile (less emissions) → higher score.
    const dimScore = sigmoidScore(1 - blendedPct);

    return {
      category: CATEGORY_LABELS[key],
      emission: value,
      maxReference: Math.round(gStats.p95 * 100) / 100,
      categoryScore: Math.round(dimScore * 10) / 10,
      percentile: Math.round((1 - blendedPct) * 100),
    };
  });

  // --- Weighted aggregate score ---
  let weightedSum = 0;
  for (let i = 0; i < EMISSION_KEYS.length; i++) {
    const key = EMISSION_KEYS[i];
    weightedSum += breakdown[i].categoryScore * featureWeights[key];
  }
  score = Math.round(Math.max(0, Math.min(10, weightedSum)) * 10) / 10;

  // --- Global percentile for the total ---
  const allTotals = globalStats._totals;
  if (allTotals) {
    const pct = percentileRank(allTotals.sorted, totalEmissions);
    percentile = Math.round((1 - pct) * 100); // 100 = best
  }

  // --- Category rank ---
  if (productCategory && categoryStats[productCategory]) {
    const catTotals = categoryStats[productCategory]._totals;
    if (catTotals) {
      const pct = percentileRank(catTotals.sorted, totalEmissions);
      categoryRank = Math.round((1 - pct) * 100);
    }
    confidence = Math.min(1, categoryStats[productCategory].sampleCount / 30);
  }

  return {
    score,
    color: getColor(score),
    totalEmissions,
    breakdown,
    confidence: Math.round(confidence * 100) / 100,
    percentile,
    categoryRank,
  };
}

// ─── Non-linear transform ───────────────────────────────────────────────────

/**
 * Sigmoid-based scoring: maps a value in [0,1] to [0,10].
 *
 * The steepness parameter controls how aggressively the curve compresses
 * the tails. At k=5 the middle 60% of the input range maps to ~70% of the
 * output range, giving much better discrimination where products cluster.
 */
function sigmoidScore(x) {
  const k = 5; // steepness
  const midpoint = 0.5;
  const raw = 1 / (1 + Math.exp(-k * (x - midpoint)));
  // Normalize so that sigmoid(0)→0 and sigmoid(1)→10
  const low = 1 / (1 + Math.exp(-k * (0 - midpoint)));
  const high = 1 / (1 + Math.exp(-k * (1 - midpoint)));
  return ((raw - low) / (high - low)) * 10;
}

// ─── Statistical helpers ────────────────────────────────────────────────────

function computeStats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((s, v) => s + v, 0) / n;
  const variance = sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);

  return {
    mean,
    std,
    p25: sorted[Math.floor(n * 0.25)] || 0,
    p50: sorted[Math.floor(n * 0.5)] || 0,
    p75: sorted[Math.floor(n * 0.75)] || 0,
    p95: sorted[Math.floor(n * 0.95)] || 0,
    sorted,
  };
}

/**
 * Returns the percentile rank of `value` within a sorted array.
 * 0.0 = at or below the minimum, 1.0 = at or above the maximum.
 */
function percentileRank(sorted, value) {
  if (!sorted || sorted.length === 0) return 0.5;
  if (value <= sorted[0]) return 0;
  if (value >= sorted[sorted.length - 1]) return 1;

  // Binary search for insertion point
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  return lo / sorted.length;
}

// ─── Fallback v1 algorithm (for untrained state / unit tests) ───────────────

function fallbackScore(emissions) {
  const categories = Object.keys(FALLBACK_MAX);
  const totalMax = Object.values(FALLBACK_MAX).reduce((a, b) => a + b, 0);
  const totalClamped = categories.reduce(
    (sum, cat) => sum + Math.min(emissions[cat] || 0, FALLBACK_MAX[cat]),
    0
  );
  const score = Math.round(Math.max(0, Math.min(10, (1 - totalClamped / totalMax) * 10)) * 10) / 10;

  const breakdown = categories.map((cat) => {
    const value = emissions[cat] || 0;
    const catScore =
      Math.round((1 - Math.min(value, FALLBACK_MAX[cat]) / FALLBACK_MAX[cat]) * 10 * 10) / 10;
    return {
      category: CATEGORY_LABELS[cat],
      emission: value,
      maxReference: FALLBACK_MAX[cat],
      categoryScore: Math.max(0, catScore),
    };
  });

  return { score, color: getColor(score), breakdown };
}

// ─── Color thresholds ───────────────────────────────────────────────────────

function getColor(score) {
  if (score >= 7) return "green";
  if (score >= 4) return "yellow";
  return "red";
}

module.exports = {
  trainModel,
  calculateGreenGrade,
  getColor,
  CATEGORY_LABELS,
  // Exposed for testing
  sigmoidScore,
  percentileRank,
  computeStats,
};
