/**
 * GreenGrade ML Algorithm v3
 *
 * A data-driven sustainability scoring model that learns emission distributions
 * from the product catalog at startup, then scores each product using:
 *
 *   1. Gaussian Kernel Density Estimation – replaces raw percentile lookup with
 *      smooth probability density estimates. Uses Silverman bandwidth and
 *      evaluates the CDF at the query point for each dimension. Handles
 *      sparse tails and clustered centers far better than sorted-array ranks.
 *
 *   2. Variance-based feature importance  – dimensions with more spread carry
 *      more weight because they better discriminate sustainable vs. harmful.
 *
 *   3. Category-aware blended scoring     – 60 % category-relative KDE CDF,
 *      40 % global KDE CDF, then sigmoid-transformed.
 *
 *   4. Non-linear sigmoid transform       – compresses the tails and expands
 *      the middle, giving better resolution where most products cluster.
 *
 *   5. Mahalanobis anomaly detection      – computes the Mahalanobis distance
 *      of each product's emission vector from its category centroid, using
 *      the full covariance matrix. Flags outliers beyond the chi-squared
 *      95th-percentile threshold for 7 degrees of freedom.
 *
 *   6. Confidence signal                  – based on category sample size.
 *
 * Output is fully backward-compatible: { score, color, totalEmissions, breakdown }
 * with optional new fields: confidence, percentile, categoryRank, anomaly,
 * and provenance fields: dataConfidence, dataTier, sources.
 *
 * Score 10 = most sustainable, 0 = least sustainable.
 * Color: green (7-10), yellow (4-6.9), red (0-3.9)
 */

const { getProductProvenance } = require("./dataProvenance");

const EMISSION_KEYS = [
  "landUseChange",
  "animalFeed",
  "farm",
  "processing",
  "transport",
  "packaging",
  "retail",
];

const DIM = EMISSION_KEYS.length; // 7

const CATEGORY_LABELS = {
  landUseChange: "Land Use Change",
  animalFeed: "Animal Feed",
  farm: "Farm",
  processing: "Processing",
  transport: "Transport",
  packaging: "Packaging",
  retail: "Retail",
};

// Fallback maximums (v1 compat for untrained calls)
const FALLBACK_MAX = {
  landUseChange: 12.0,
  animalFeed: 8.0,
  farm: 25.0,
  processing: 3.0,
  transport: 2.0,
  packaging: 1.5,
  retail: 1.0,
};

// Chi-squared 95th percentile for 7 degrees of freedom.
// Products with Mahalanobis distance² > this are flagged anomalous.
const CHI2_95_7DF = 14.067;

const MODEL_VERSION = "v3.0";

// Blend ratio between category-relative and global KDE CDFs.
const CATEGORY_BLEND_WEIGHT = 0.6;
const GLOBAL_BLEND_WEIGHT = 0.4;

// ─── Learned model state (populated by trainModel) ──────────────────────────

let trained = false;

let globalStats = {}; // { key: { mean, std, sorted, bandwidth, kdeData } }
let categoryStats = {}; // { "Protein": { key: { … }, sampleCount, covInv, centroid } }
let featureWeights = {}; // { key: weight } sums to 1.0

// ─── Training ───────────────────────────────────────────────────────────────

function trainModel(products) {
  if (!products || products.length === 0) return;

  const vectors = products
    .filter((p) => p.emissions)
    .map((p) => ({ category: p.category, emissions: p.emissions }));

  if (vectors.length === 0) return;

  // --- Global KDE stats per dimension ---
  globalStats = {};
  for (const key of EMISSION_KEYS) {
    const vals = vectors.map((v) => v.emissions[key] || 0);
    globalStats[key] = buildKdeStats(vals);
  }

  // Global total emissions
  const globalTotals = vectors.map((v) =>
    EMISSION_KEYS.reduce((s, k) => s + (v.emissions[k] || 0), 0)
  );
  globalStats._totals = buildKdeStats(globalTotals);

  // --- Per-category KDE stats + covariance for anomaly detection ---
  categoryStats = {};
  const grouped = {};
  for (const v of vectors) {
    const cat = v.category || "Unknown";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(v.emissions);
  }

  for (const [cat, emissionsList] of Object.entries(grouped)) {
    const catData = { sampleCount: emissionsList.length };

    // Per-dimension KDE
    for (const key of EMISSION_KEYS) {
      const vals = emissionsList.map((e) => e[key] || 0);
      catData[key] = buildKdeStats(vals);
    }

    // Total emissions KDE
    const totals = emissionsList.map((e) => EMISSION_KEYS.reduce((s, k) => s + (e[k] || 0), 0));
    catData._totals = buildKdeStats(totals);

    // Centroid + covariance matrix for Mahalanobis distance
    const matrix = emissionsList.map((e) => EMISSION_KEYS.map((k) => e[k] || 0));
    catData.centroid = computeCentroid(matrix);
    catData.covInv = computeCovarianceInverse(matrix, catData.centroid);

    categoryStats[cat] = catData;
  }

  // --- Feature importance via coefficient of variation ---
  const rawImportance = {};
  let importanceSum = 0;
  for (const key of EMISSION_KEYS) {
    const s = globalStats[key];
    const cv = s.mean > 0.001 ? s.std / s.mean : 0;
    const range = s.p95 - (s.sorted[0] || 0);
    const importance = cv * 0.7 + (range / (s.mean || 1)) * 0.3;
    rawImportance[key] = Math.max(importance, 0.01);
    importanceSum += rawImportance[key];
  }

  featureWeights = {};
  for (const key of EMISSION_KEYS) {
    featureWeights[key] = rawImportance[key] / importanceSum;
  }

  trained = true;
}

// ─── Scoring ────────────────────────────────────────────────────────────────

function calculateGreenGrade(emissions, productCategory, product) {
  const totalEmissions =
    Math.round(EMISSION_KEYS.reduce((sum, k) => sum + (emissions[k] || 0), 0) * 100) / 100;

  if (!trained) {
    const result = fallbackScore(emissions);
    return { ...result, totalEmissions };
  }

  // --- Per-dimension scoring via KDE ---
  const breakdown = EMISSION_KEYS.map((key) => {
    const value = emissions[key] || 0;
    const gStats = globalStats[key];
    const cStats =
      productCategory && categoryStats[productCategory]
        ? categoryStats[productCategory][key]
        : null;

    // KDE-based CDF: probability that a random product has emission <= value
    const globalCdf = kdeCdf(gStats, value);
    const catCdf = cStats ? kdeCdf(cStats, value) : globalCdf;

    // Blend: 60 % category, 40 % global
    const blendedCdf = cStats
      ? catCdf * CATEGORY_BLEND_WEIGHT + globalCdf * GLOBAL_BLEND_WEIGHT
      : globalCdf;

    // Lower CDF (less emissions than peers) → higher score
    const dimScore = sigmoidScore(1 - blendedCdf);

    return {
      category: CATEGORY_LABELS[key],
      emission: value,
      maxReference: Math.round(gStats.p95 * 100) / 100,
      categoryScore: Math.round(dimScore * 10) / 10,
      percentile: Math.round((1 - blendedCdf) * 100),
    };
  });

  // --- Weighted aggregate score ---
  let weightedSum = 0;
  for (let i = 0; i < EMISSION_KEYS.length; i++) {
    weightedSum += breakdown[i].categoryScore * featureWeights[EMISSION_KEYS[i]];
  }
  const score = Math.round(Math.max(0, Math.min(10, weightedSum)) * 10) / 10;

  // --- Global percentile via KDE ---
  let percentile = null;
  if (globalStats._totals) {
    const cdf = kdeCdf(globalStats._totals, totalEmissions);
    percentile = Math.round((1 - cdf) * 100);
  }

  // --- Category rank via KDE ---
  let categoryRank = null;
  let confidence = 1.0;
  if (productCategory && categoryStats[productCategory]) {
    const catData = categoryStats[productCategory];
    if (catData._totals) {
      const cdf = kdeCdf(catData._totals, totalEmissions);
      categoryRank = Math.round((1 - cdf) * 100);
    }
    confidence = Math.min(1, catData.sampleCount / 30);
  }

  // --- Anomaly detection via Mahalanobis distance ---
  let anomaly = null;
  if (productCategory && categoryStats[productCategory]) {
    const catData = categoryStats[productCategory];
    if (catData.covInv && catData.centroid) {
      const vec = EMISSION_KEYS.map((k) => emissions[k] || 0);
      const dist2 = mahalanobisDistance2(vec, catData.centroid, catData.covInv);
      const isAnomaly = dist2 > CHI2_95_7DF;
      anomaly = {
        isAnomaly,
        distance: Math.round(Math.sqrt(Math.max(0, dist2)) * 100) / 100,
        threshold: Math.round(Math.sqrt(CHI2_95_7DF) * 100) / 100,
      };
    }
  }

  // --- Data provenance ---
  const provenance = product ? getProductProvenance(product, product.source) : null;

  return {
    score,
    color: getColor(score),
    totalEmissions,
    breakdown,
    confidence: Math.round(confidence * 100) / 100,
    percentile,
    categoryRank,
    anomaly,
    ...(provenance && {
      dataConfidence: provenance.dataConfidence,
      dataTier: provenance.dataTier,
      dataTierLabel: provenance.dataTierLabel,
      sources: provenance.sources,
      sourceCount: provenance.sourceCount,
      referenceProduct: provenance.referenceProduct,
      agreementWithReference: provenance.agreementWithReference,
      lastVerified: provenance.lastVerified,
    }),
  };
}

// ─── Kernel Density Estimation ──────────────────────────────────────────────

/**
 * Builds KDE-ready statistics from a 1-D sample.
 * Stores the sorted values, bandwidth (Silverman's rule), and basic stats
 * needed by kdeCdf().
 */
function buildKdeStats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((s, v) => s + v, 0) / n;
  const variance = sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);

  // Silverman's rule of thumb for bandwidth
  const iqr = (sorted[Math.floor(n * 0.75)] || 0) - (sorted[Math.floor(n * 0.25)] || 0);
  const bandwidth = 1.06 * Math.min(std, iqr / 1.34) * Math.pow(n, -0.2);

  return {
    mean,
    std,
    p25: sorted[Math.floor(n * 0.25)] || 0,
    p50: sorted[Math.floor(n * 0.5)] || 0,
    p75: sorted[Math.floor(n * 0.75)] || 0,
    p95: sorted[Math.floor(n * 0.95)] || 0,
    sorted,
    bandwidth: Math.max(bandwidth, 0.001), // floor to prevent zero bandwidth
  };
}

/**
 * Evaluates the Gaussian KDE cumulative distribution function at point x.
 *
 * CDF_kde(x) = (1/n) * Σ Φ((x − xᵢ) / h)
 *
 * where Φ is the standard normal CDF and h is the bandwidth.
 * This gives the smooth probability that a random sample ≤ x.
 */
function kdeCdf(stats, x) {
  const { sorted, bandwidth } = stats;
  const n = sorted.length;
  if (n === 0) return 0.5;

  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += normalCdf((x - sorted[i]) / bandwidth);
  }
  // Clamp to [0.001, 0.999] to avoid exact 0 or 1
  return Math.max(0.001, Math.min(0.999, sum / n));
}

/**
 * Standard normal CDF approximation (Abramowitz & Stegun 26.2.17).
 * Maximum error < 7.5e-8.
 *
 * Uses the upper-tail approximation Q(x) = φ(x) · poly(t) where
 * t = 1/(1 + p·|x|) and φ(x) = exp(-x²/2) / √(2π).
 */
function normalCdf(x) {
  if (x < -8) return 0;
  if (x > 8) return 1;

  const absX = Math.abs(x);
  const t = 1 / (1 + 0.2316419 * absX);
  const phi = 0.3989422804014327 * Math.exp(-0.5 * absX * absX); // φ(x) = exp(-x²/2)/√(2π)

  const poly =
    t *
    (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));

  const q = phi * poly; // upper-tail probability Q(x) for x >= 0

  return x >= 0 ? 1 - q : q;
}

// ─── Anomaly detection: Mahalanobis distance ────────────────────────────────

/** Compute the centroid (mean vector) of a matrix of row vectors. */
function computeCentroid(matrix) {
  const n = matrix.length;
  const d = matrix[0].length;
  const centroid = new Array(d).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      centroid[j] += matrix[i][j];
    }
  }
  for (let j = 0; j < d; j++) centroid[j] /= n;
  return centroid;
}

/**
 * Compute the inverse of the covariance matrix using Gauss-Jordan elimination.
 * Adds a small regularization term (1e-6) to the diagonal to guarantee
 * invertibility even when some dimensions have zero variance.
 * Returns null if the matrix is still singular after regularization.
 */
function computeCovarianceInverse(matrix, centroid) {
  const n = matrix.length;
  const d = centroid.length;

  if (n < d + 1) return null; // not enough samples for stable inversion

  // Build covariance matrix
  const cov = Array.from({ length: d }, () => new Array(d).fill(0));
  for (let i = 0; i < n; i++) {
    for (let a = 0; a < d; a++) {
      const da = matrix[i][a] - centroid[a];
      for (let b = a; b < d; b++) {
        const db = matrix[i][b] - centroid[b];
        cov[a][b] += da * db;
      }
    }
  }
  // Symmetrize and normalize
  for (let a = 0; a < d; a++) {
    for (let b = a; b < d; b++) {
      cov[a][b] /= n;
      cov[b][a] = cov[a][b];
    }
    // Tikhonov regularization
    cov[a][a] += 1e-6;
  }

  return invertMatrix(cov);
}

/**
 * Gauss-Jordan matrix inversion for a d×d matrix.
 * Returns the inverse or null if singular.
 */
function invertMatrix(mat) {
  const d = mat.length;
  // Build augmented matrix [mat | I]
  const aug = mat.map((row, i) => {
    const augRow = new Array(2 * d).fill(0);
    for (let j = 0; j < d; j++) augRow[j] = row[j];
    augRow[d + i] = 1;
    return augRow;
  });

  for (let col = 0; col < d; col++) {
    // Partial pivoting
    let maxRow = col;
    let maxVal = Math.abs(aug[col][col]);
    for (let row = col + 1; row < d; row++) {
      const val = Math.abs(aug[row][col]);
      if (val > maxVal) {
        maxVal = val;
        maxRow = row;
      }
    }
    if (maxVal < 1e-12) return null; // singular

    if (maxRow !== col) {
      [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    }

    // Scale pivot row
    const pivot = aug[col][col];
    for (let j = 0; j < 2 * d; j++) aug[col][j] /= pivot;

    // Eliminate column
    for (let row = 0; row < d; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = 0; j < 2 * d; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  // Extract inverse from right half
  return aug.map((row) => row.slice(d));
}

/**
 * Squared Mahalanobis distance: (x - μ)ᵀ Σ⁻¹ (x - μ)
 */
function mahalanobisDistance2(vec, centroid, covInv) {
  const d = vec.length;
  const diff = vec.map((v, i) => v - centroid[i]);

  let dist2 = 0;
  for (let i = 0; i < d; i++) {
    for (let j = 0; j < d; j++) {
      dist2 += diff[i] * covInv[i][j] * diff[j];
    }
  }
  return dist2;
}

// ─── Non-linear transform ───────────────────────────────────────────────────

function sigmoidScore(x) {
  const k = 5;
  const midpoint = 0.5;
  const raw = 1 / (1 + Math.exp(-k * (x - midpoint)));
  const low = 1 / (1 + Math.exp(-k * (0 - midpoint)));
  const high = 1 / (1 + Math.exp(-k * (1 - midpoint)));
  return ((raw - low) / (high - low)) * 10;
}

// ─── Legacy helpers (still used by tests) ───────────────────────────────────

function computeStats(values) {
  return buildKdeStats(values);
}

function percentileRank(sorted, value) {
  if (!sorted || sorted.length === 0) return 0.5;
  if (value <= sorted[0]) return 0;
  if (value >= sorted[sorted.length - 1]) return 1;
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  return lo / sorted.length;
}

// ─── Fallback v1 (untrained) ────────────────────────────────────────────────

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

// Snapshot of the hardcoded constants that govern scoring, for the
// parameter audit trail (distinct from per-product score change logs).
function getModelParameters() {
  return {
    version: MODEL_VERSION,
    fallbackMax: FALLBACK_MAX,
    chiSquared95_7df: CHI2_95_7DF,
    blendWeights: {
      category: CATEGORY_BLEND_WEIGHT,
      global: GLOBAL_BLEND_WEIGHT,
    },
  };
}

function getColor(score) {
  if (score >= 7) return "green";
  if (score >= 4) return "yellow";
  return "red";
}

module.exports = {
  trainModel,
  calculateGreenGrade,
  getColor,
  getModelParameters,
  CATEGORY_LABELS,
  // Exposed for testing
  sigmoidScore,
  percentileRank,
  computeStats,
  normalCdf,
  kdeCdf,
  buildKdeStats,
  mahalanobisDistance2,
  computeCentroid,
  computeCovarianceInverse,
  invertMatrix,
};
