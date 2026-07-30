/**
 * ML Insights Service
 * ======================
 * Course-aligned ML layer for GreenGrade, complementing (not replacing) the
 * existing KDE + Mahalanobis engine in `greengrade.js`.
 *
 * All "training" happens offline in Python (scikit-learn), driven by
 * `ml/greengrade_ml_analysis.py`. That script exports `ml_artifacts.json`:
 * scaler parameters, a decision-tree ruleset (classification), a decision-tree
 * ruleset (regression), K-Means centroids, per-product cluster labels, and a
 * cosine-similarity index. This file loads that JSON at server startup and
 * evaluates it at request time using plain JS -- no Python process, no new
 * runtime dependency, same "trained offline, scored in JS" pattern already
 * used by greengrade.js.
 *
 * Regenerate artifacts after any product catalog change:
 *   cd ml && python greengrade_ml_analysis.py --data ../backend/src/data/products.json --out ../backend/src/data
 */

const fs = require("fs");
const path = require("path");
const { logger } = require("../middleware/logger");

let artifacts = null;

function loadArtifacts(artifactsPath) {
  const resolved = artifactsPath || path.join(__dirname, "..", "data", "ml_artifacts.json");

  if (!fs.existsSync(resolved)) {
    logger.warn(
      `mlInsights: artifacts not found at ${resolved} -- run ml/greengrade_ml_analysis.py first. ML endpoints will return 503 until then.`
    );
    artifacts = null;
    return false;
  }

  artifacts = JSON.parse(fs.readFileSync(resolved, "utf-8"));
  return true;
}

function isReady() {
  return artifacts !== null;
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

function scaleVector(emissions, keys, scaler) {
  return keys.map((k, i) => ((emissions[k] || 0) - scaler.mean[i]) / scaler.scale[i]);
}

/** Walk an exported decision-tree ruleset (see export_decision_tree_rules in
 * the Python script) against a raw (unscaled) emissions object. */
function walkTree(node, emissions) {
  if (node.leaf) return node.prediction;
  const value = emissions[node.feature] || 0;
  return value <= node.threshold ? walkTree(node.left, emissions) : walkTree(node.right, emissions);
}

// ─── Task 1: category classification ─────────────────────────────────────────

/**
 * Predict a product's category from its emissions profile using the trained
 * decision tree. Useful for catching mis-tagged SKUs or auto-categorizing new
 * products before an admin confirms the category manually.
 */
function classifyCategory(emissions) {
  if (!isReady()) throw new Error("ML artifacts not loaded");
  return walkTree(artifacts.decision_tree_rules, emissions);
}

// ─── Task 2: emissions estimation for incomplete data ────────────────────────

/**
 * Estimate total emissions from only the "easy to measure" logistics stages
 * (transport, packaging, retail) using the trained regression tree. This is a
 * direct upgrade path for Tier 3 ("estimated") products in dataProvenance.js,
 * which currently fall back to a flat category average instead of a model
 * conditioned on the product's own partial data.
 */
function estimateEmissions(partialEmissions) {
  if (!isReady()) throw new Error("ML artifacts not loaded");
  return walkTree(artifacts.regression_tree_rules, partialEmissions);
}

// ─── Task 3: clustering ──────────────────────────────────────────────────────

function getClusterForProduct(productId) {
  if (!isReady()) throw new Error("ML artifacts not loaded");
  return artifacts.product_cluster_labels[String(productId)] ?? null;
}

function getClusterSummary() {
  if (!isReady()) throw new Error("ML artifacts not loaded");
  const counts = {};
  for (const cluster of Object.values(artifacts.product_cluster_labels)) {
    counts[cluster] = (counts[cluster] || 0) + 1;
  }
  return {
    n_clusters: artifacts.kmeans_centroids.length,
    products_per_cluster: counts,
  };
}

// ─── Similarity: "greener alternatives" (cosine similarity) ──────────────────

/**
 * Cosine similarity via dot product of pre-normalized unit vectors (vectors
 * were normalized during export, so no division is needed at query time).
 */
function findSimilarProducts(productId, { k = 5, greenerOnly = true } = {}) {
  if (!isReady()) throw new Error("ML artifacts not loaded");

  const idx = artifacts.similarity_index;
  const targetIndex = idx.product_ids.indexOf(String(productId));
  if (targetIndex === -1) return null;

  const targetVec = idx.unit_vectors[targetIndex];
  const targetEmissions = idx.total_emissions[targetIndex];
  const targetCategory = idx.categories[targetIndex];

  const scored = [];
  for (let i = 0; i < idx.product_ids.length; i++) {
    if (i === targetIndex) continue;
    if (greenerOnly && idx.total_emissions[i] >= targetEmissions) continue;

    const otherVec = idx.unit_vectors[i];
    let dot = 0;
    for (let d = 0; d < targetVec.length; d++) dot += targetVec[d] * otherVec[d];

    scored.push({
      product_id: idx.product_ids[i],
      category: idx.categories[i],
      total_emissions: idx.total_emissions[i],
      similarity: Math.round(dot * 1000) / 1000,
      same_category: idx.categories[i] === targetCategory,
    });
  }

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, k);
}

module.exports = {
  loadArtifacts,
  isReady,
  classifyCategory,
  estimateEmissions,
  getClusterForProduct,
  getClusterSummary,
  findSimilarProducts,
  // exposed for testing
  scaleVector,
  walkTree,
};
