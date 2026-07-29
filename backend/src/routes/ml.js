/**
 * ML Insights routes
 * =====================
 * Course-aligned ML endpoints, separate from the existing /api/v1/passport
 * and /api/v1/portfolio routes so the KDE engine (greengrade.js) and the
 * scikit-learn-derived engine (mlInsights.js) stay clearly distinguishable
 * in the API surface and in the methodology docs.
 *
 * All endpoints are advisory and read-only: they never modify a product's
 * category, emissions, or GreenGrade score, and never touch the score audit
 * log. Acting on a prediction requires a separate, explicitly logged admin
 * action, per the governance charter.
 */

const express = require("express");
const validator = require("validator");
const router = express.Router();
const { validate } = require("../middleware/validate");
const mlInsights = require("../services/mlInsights");

const EMISSION_KEYS = [
  "landUseChange",
  "animalFeed",
  "farm",
  "processing",
  "transport",
  "packaging",
  "retail",
];
const PARTIAL_KEYS = ["transport", "packaging", "retail"];

function sanitize(str, maxLen = 100) {
  if (typeof str !== "string") return "";
  return validator.escape(validator.trim(str)).slice(0, maxLen);
}

// Guard: if artifacts haven't been generated/loaded yet, fail clearly
// instead of throwing an unhandled error deep in the service layer.
function requireMlReady(_req, res, next) {
  if (!mlInsights.isReady()) {
    return res.status(503).json({
      error: "ML artifacts not loaded",
      message:
        "Run ml/greengrade_ml_analysis.py and restart the server, or call loadArtifacts() with the correct path.",
    });
  }
  next();
}

function numericEmissionsCheck(body, keys) {
  for (const key of keys) {
    if (body[key] !== undefined && typeof body[key] !== "number") {
      return `${key} must be a number`;
    }
  }
  if (!keys.some((key) => typeof body[key] === "number")) {
    return `At least one of ${keys.join(", ")} is required`;
  }
  return null;
}

const SIMILAR_SCHEMA = {
  query: {
    k: {
      required: false,
      type: "string",
      pattern: /^\d+$/,
      message: "k must be a positive integer",
    },
    greenerOnly: {
      required: false,
      type: "string",
      pattern: /^(true|false)$/,
      message: "greenerOnly must be true or false",
    },
  },
};

/**
 * GET /api/v1/ml/similar/:productId?k=5&greenerOnly=true
 * Returns the top-k most similar products by cosine similarity over the
 * scaled 7-dimension emissions vector. Defaults to greener alternatives only.
 */
router.get("/similar/:productId", requireMlReady, validate(SIMILAR_SCHEMA), (req, res) => {
  const productId = sanitize(req.params.productId, 20);
  if (!validator.isAlphanumeric(productId)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  const k = Math.min(parseInt(req.query.k, 10) || 5, 20);
  const greenerOnly = req.query.greenerOnly !== "false";

  const results = mlInsights.findSimilarProducts(productId, { k, greenerOnly });
  if (results === null) {
    return res.status(404).json({ error: `Product ${productId} not found in similarity index` });
  }
  res.json({ product_id: productId, k, greener_only: greenerOnly, results });
});

/**
 * POST /api/v1/ml/classify
 * Body: { landUseChange, animalFeed, farm, processing, transport, packaging, retail }
 * Predicts the product category from its emissions profile (decision tree).
 * Intended for catching mis-tagged SKUs and pre-filling category on new
 * product intake -- NOT a replacement for manual category assignment.
 */
router.post("/classify", requireMlReady, (req, res) => {
  const emissions = req.body || {};
  const validationError = numericEmissionsCheck(emissions, EMISSION_KEYS);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }
  const predictedCategory = mlInsights.classifyCategory(emissions);
  res.json({ predicted_category: predictedCategory, advisory: true });
});

/**
 * POST /api/v1/ml/estimate-emissions
 * Body: { transport, packaging, retail }
 * Estimates total emissions from partial (logistics-only) data using the
 * trained regression tree. Upgrade path for Tier 3 "estimated" products.
 */
router.post("/estimate-emissions", requireMlReady, (req, res) => {
  const partial = req.body || {};
  const validationError = numericEmissionsCheck(partial, PARTIAL_KEYS);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }
  const estimatedTotal = mlInsights.estimateEmissions(partial);
  res.json({ estimated_total_emissions_kg_co2e: estimatedTotal, advisory: true });
});

/**
 * GET /api/v1/ml/clusters
 * Returns K-Means cluster summary (cluster count, products per cluster).
 * Feeds a "sustainability segments" view and cross-checks against the
 * existing Mahalanobis-based anomaly detection in greengrade.js.
 */
router.get("/clusters", requireMlReady, (_req, res) => {
  res.json(mlInsights.getClusterSummary());
});

/**
 * GET /api/v1/ml/clusters/:productId
 * Returns which cluster a specific product belongs to.
 */
router.get("/clusters/:productId", requireMlReady, (req, res) => {
  const productId = sanitize(req.params.productId, 20);
  if (!validator.isAlphanumeric(productId)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }
  const cluster = mlInsights.getClusterForProduct(productId);
  if (cluster === null) {
    return res.status(404).json({ error: `Product ${productId} not found` });
  }
  res.json({ product_id: productId, cluster });
});

module.exports = router;
