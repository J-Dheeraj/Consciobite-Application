const express = require("express");
const validator = require("validator");
const router = express.Router();
const { validate } = require("../middleware/validate");

const COMPARE_SCHEMA = {
  query: {
    ids: { required: true, type: "string", message: "Provide product IDs as ?ids=id1,id2,id3" },
  },
};
const products = require("../data/products.json");
const { calculateGreenGrade } = require("../services/greengrade");
const { logger } = require("../middleware/logger");

function enrichProduct(product) {
  const grade = calculateGreenGrade(product.emissions, product.category, product);
  return { ...product, greenGrade: grade };
}

// Pre-compute enriched products at module load (product catalog is static)
const enrichedProducts = products.map(enrichProduct);

function sanitize(str, maxLen = 100) {
  if (typeof str !== "string") return "";
  return validator.escape(validator.trim(str)).slice(0, maxLen);
}

const VALID_SORTS = ["grade_asc", "grade_desc", "emissions_asc", "emissions_desc"];
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const OPEN_FOOD_FACTS_TIMEOUT_MS = 10_000;

// GET /api/products
router.get("/", (req, res) => {
  const search = req.query.search ? sanitize(req.query.search, 50) : "";
  const category = req.query.category ? sanitize(req.query.category, 30) : "";
  const sort = VALID_SORTS.includes(req.query.sort) ? req.query.sort : "";

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE)
  );

  let results = [...enrichedProducts];

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  if (category) {
    results = results.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  if (sort === "grade_asc") results.sort((a, b) => a.greenGrade.score - b.greenGrade.score);
  else if (sort === "grade_desc") results.sort((a, b) => b.greenGrade.score - a.greenGrade.score);
  else if (sort === "emissions_asc")
    results.sort((a, b) => a.greenGrade.totalEmissions - b.greenGrade.totalEmissions);
  else if (sort === "emissions_desc")
    results.sort((a, b) => b.greenGrade.totalEmissions - a.greenGrade.totalEmissions);

  const totalCount = results.length;
  const totalPages = Math.ceil(totalCount / limit);
  const startIndex = (page - 1) * limit;
  const paginatedResults = results.slice(startIndex, startIndex + limit);

  res.json({
    products: paginatedResults,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
});

// GET /api/products/compare
router.get("/compare", validate(COMPARE_SCHEMA), (req, res) => {
  const ids = req.query.ids
    .split(",")
    .map((id) => sanitize(id.trim(), 20))
    .filter(Boolean);

  if (ids.length < 2 || ids.length > 5) {
    return res.status(400).json({ error: "Provide between 2 and 5 product IDs to compare" });
  }

  for (const id of ids) {
    if (!validator.isAlphanumeric(id)) {
      return res.status(400).json({ error: `Invalid product ID: ${id}` });
    }
  }

  const found = ids
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean)
    .map(enrichProduct);

  if (found.length < 2) {
    return res.status(404).json({ error: "Not enough valid products found to compare" });
  }

  res.json({ products: found });
});

// GET /api/products/stats
router.get("/stats", (req, res) => {
  const categories = {};

  for (const p of enrichedProducts) {
    if (!categories[p.category]) {
      categories[p.category] = { count: 0, totalScore: 0, totalEmissions: 0 };
    }
    categories[p.category].count++;
    categories[p.category].totalScore += p.greenGrade.score;
    categories[p.category].totalEmissions += p.greenGrade.totalEmissions;
  }

  const stats = Object.entries(categories).map(([name, data]) => ({
    category: name,
    productCount: data.count,
    avgScore: Math.round((data.totalScore / data.count) * 10) / 10,
    avgEmissions: Math.round((data.totalEmissions / data.count) * 100) / 100,
  }));

  stats.sort((a, b) => b.avgScore - a.avgScore);

  res.json({ totalProducts: products.length, categories: stats });
});

const OPEN_FOOD_FACTS_RETRIES = 2;
const OPEN_FOOD_FACTS_BACKOFF_MS = 300;

// Circuit breaker: after BREAKER_THRESHOLD consecutive failed lookups the
// breaker opens and requests fail fast with "unavailable" (no upstream call)
// until BREAKER_COOLDOWN_MS passes; the next request then probes upstream
// (half-open) and either closes the breaker or re-opens it. Prevents a dead
// upstream from tying up ~31s of retries per request.
const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 60_000;
const breaker = { consecutiveFailures: 0, openedAt: null };

function breakerIsOpen() {
  if (breaker.openedAt === null) return false;
  if (Date.now() - breaker.openedAt >= BREAKER_COOLDOWN_MS) return false; // half-open: allow a probe
  return true;
}

function breakerRecordSuccess() {
  breaker.consecutiveFailures = 0;
  breaker.openedAt = null;
}

function breakerRecordFailure() {
  breaker.consecutiveFailures++;
  if (breaker.consecutiveFailures >= BREAKER_THRESHOLD) {
    breaker.openedAt = Date.now();
    logger.warn(
      `Open Food Facts circuit breaker opened after ${breaker.consecutiveFailures} consecutive failures`
    );
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Lookup a product by barcode via Open Food Facts, with retry + backoff.
// Returns a discriminated result so callers can tell an upstream outage
// apart from a genuine miss:
//   { status: "found", product } | { status: "not_found" } | { status: "unavailable" }
// Skips external calls in NODE_ENV=test for deterministic results.
async function lookupOpenFoodFacts(barcode) {
  if (process.env.NODE_ENV === "test") return { status: "not_found" };

  if (breakerIsOpen()) {
    return { status: "unavailable" };
  }

  let lastError;
  for (let attempt = 0; attempt <= OPEN_FOOD_FACTS_RETRIES; attempt++) {
    if (attempt > 0) await sleep(OPEN_FOOD_FACTS_BACKOFF_MS * 2 ** (attempt - 1));

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), OPEN_FOOD_FACTS_TIMEOUT_MS);
      let response;
      try {
        response = await fetch(
          `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,brands,categories_tags,ecoscore_grade,ecoscore_score,nutriments`,
          { signal: controller.signal }
        );
      } finally {
        clearTimeout(timeout);
      }

      // 5xx is an upstream failure worth retrying; other non-OK is a miss
      if (response.status >= 500) {
        lastError = new Error(`upstream returned ${response.status}`);
        continue;
      }
      if (!response.ok) {
        breakerRecordSuccess(); // upstream answered — not a service failure
        return { status: "not_found" };
      }

      const data = await response.json();
      if (!data.product || data.status === 0) {
        breakerRecordSuccess();
        return { status: "not_found" };
      }

      const p = data.product;
      const category = mapOpenFoodFactsCategory(p.categories_tags || []);
      const externalProduct = {
        id: `off_${barcode}`,
        name: p.product_name || "Unknown Product",
        brand: p.brands || "Unknown Brand",
        category,
        description: `Product from Open Food Facts database. Ecoscore: ${p.ecoscore_grade || "unknown"}.`,
        barcode,
        emissions: estimateEmissions(p.ecoscore_grade, category),
        source: "openfoodfacts",
      };
      breakerRecordSuccess();
      return { status: "found", product: enrichProduct(externalProduct) };
    } catch (err) {
      lastError = err;
    }
  }

  breakerRecordFailure();
  logger.warn(
    `Open Food Facts unavailable for ${barcode} after ${OPEN_FOOD_FACTS_RETRIES + 1} attempts: ${lastError?.message}`
  );
  return { status: "unavailable" };
}

// GET /api/products/:id/recommendations
router.get("/:id/recommendations", (req, res) => {
  const id = sanitize(req.params.id, 20);
  if (!validator.isAlphanumeric(id)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }
  const product = enrichedProducts.find((p) => p.id === id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  const similar = enrichedProducts
    .filter((p) => p.id !== id && p.category === product.category)
    .sort((a, b) => b.greenGrade.score - a.greenGrade.score)
    .slice(0, 6);
  res.json({ recommendations: similar, category: product.category });
});

// GET /api/products/:id
router.get("/:id", async (req, res, next) => {
  try {
    const id = sanitize(req.params.id, 20);

    // Open Food Facts fallback: ids like "off_<barcode>"
    if (id.startsWith("off_")) {
      const barcode = id.slice(4);
      if (!validator.isNumeric(barcode) || barcode.length < 8 || barcode.length > 14) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      const lookup = await lookupOpenFoodFacts(barcode);
      if (lookup.status === "unavailable") {
        return res
          .status(503)
          .json({ error: "Barcode lookup service temporarily unavailable, please retry" });
      }
      if (lookup.status === "not_found") {
        return res.status(404).json({ error: "Product not found" });
      }
      return res.json(lookup.product);
    }

    if (!validator.isAlphanumeric(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }
    const product = enrichedProducts.find((p) => p.id === id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/scan/:barcode - barcode lookup with Open Food Facts fallback
router.get("/scan/:barcode", async (req, res, next) => {
  try {
    const barcode = sanitize(req.params.barcode, 20);
    if (!validator.isNumeric(barcode) || barcode.length < 8 || barcode.length > 14) {
      return res.status(400).json({ error: "Invalid barcode format" });
    }

    // Try local database first
    const product = products.find((p) => p.barcode === barcode);
    if (product) {
      return res.json(enrichProduct(product));
    }

    const lookup = await lookupOpenFoodFacts(barcode);
    if (lookup.status === "found") return res.json(lookup.product);
    if (lookup.status === "unavailable") {
      return res
        .status(503)
        .json({ error: "Barcode lookup service temporarily unavailable, please retry" });
    }
    return res.status(404).json({ error: "Product not found for this barcode" });
  } catch (err) {
    next(err);
  }
});

// Map Open Food Facts categories to our categories
function mapOpenFoodFactsCategory(tags) {
  const tagStr = tags.join(",").toLowerCase();
  if (tagStr.includes("meat") || tagStr.includes("poultry")) return "Protein";
  if (tagStr.includes("fish") || tagStr.includes("seafood")) return "Seafood";
  if (
    tagStr.includes("dairy") ||
    tagStr.includes("egg") ||
    tagStr.includes("milk") ||
    tagStr.includes("cheese")
  )
    return "Dairy & Eggs";
  if (
    tagStr.includes("cereal") ||
    tagStr.includes("grain") ||
    tagStr.includes("bread") ||
    tagStr.includes("pasta") ||
    tagStr.includes("rice")
  )
    return "Grains";
  if (tagStr.includes("fruit") || tagStr.includes("juice")) return "Fruits";
  if (tagStr.includes("vegetable") || tagStr.includes("salad")) return "Vegetables";
  if (
    tagStr.includes("beverage") ||
    tagStr.includes("drink") ||
    tagStr.includes("water") ||
    tagStr.includes("tea") ||
    tagStr.includes("coffee")
  )
    return "Beverages";
  if (
    tagStr.includes("snack") ||
    tagStr.includes("chip") ||
    tagStr.includes("candy") ||
    tagStr.includes("chocolate")
  )
    return "Snacks";
  return "Pantry";
}

// Estimate emissions from ecoscore grade
function estimateEmissions(ecoGrade, category) {
  const baselines = {
    Protein: {
      landUseChange: 5,
      animalFeed: 4,
      farm: 12,
      processing: 1,
      transport: 0.8,
      packaging: 0.5,
      retail: 0.3,
    },
    Seafood: {
      landUseChange: 0.5,
      animalFeed: 2,
      farm: 6,
      processing: 1.2,
      transport: 1.2,
      packaging: 0.6,
      retail: 0.4,
    },
    "Dairy & Eggs": {
      landUseChange: 2,
      animalFeed: 2,
      farm: 5,
      processing: 0.8,
      transport: 0.5,
      packaging: 0.4,
      retail: 0.3,
    },
    Grains: {
      landUseChange: 0.3,
      animalFeed: 0,
      farm: 1,
      processing: 0.5,
      transport: 0.3,
      packaging: 0.2,
      retail: 0.2,
    },
    Fruits: {
      landUseChange: 0.2,
      animalFeed: 0,
      farm: 0.5,
      processing: 0.3,
      transport: 0.5,
      packaging: 0.3,
      retail: 0.2,
    },
    Vegetables: {
      landUseChange: 0.1,
      animalFeed: 0,
      farm: 0.8,
      processing: 0.3,
      transport: 0.4,
      packaging: 0.2,
      retail: 0.2,
    },
    Beverages: {
      landUseChange: 0.2,
      animalFeed: 0,
      farm: 0.3,
      processing: 0.8,
      transport: 0.4,
      packaging: 0.5,
      retail: 0.3,
    },
    Snacks: {
      landUseChange: 0.5,
      animalFeed: 0.3,
      farm: 1,
      processing: 1,
      transport: 0.4,
      packaging: 0.5,
      retail: 0.3,
    },
    Pantry: {
      landUseChange: 0.3,
      animalFeed: 0.1,
      farm: 0.8,
      processing: 0.6,
      transport: 0.3,
      packaging: 0.3,
      retail: 0.2,
    },
  };

  const multipliers = { a: 0.4, b: 0.65, c: 0.85, d: 1.1, e: 1.4 };
  const multiplier = multipliers[(ecoGrade || "c").toLowerCase()] || 1;
  const base = baselines[category] || baselines.Pantry;

  const emissions = {};
  for (const [key, val] of Object.entries(base)) {
    emissions[key] = Math.round(val * multiplier * 100) / 100;
  }
  return emissions;
}

module.exports = router;
