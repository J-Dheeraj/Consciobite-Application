const express = require("express");
const validator = require("validator");
const router = express.Router();
const products = require("../data/products.json");
const { calculateGreenGrade } = require("../services/greengrade");

function enrichProduct(product) {
  const grade = calculateGreenGrade(product.emissions);
  return { ...product, greenGrade: grade };
}

// Sanitize a string: trim, escape HTML entities, limit length
function sanitize(str, maxLen = 100) {
  if (typeof str !== "string") return "";
  return validator.escape(validator.trim(str)).slice(0, maxLen);
}

const VALID_SORTS = ["grade_asc", "grade_desc", "emissions_asc", "emissions_desc"];
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// GET /api/products - list products with GreenGrade, pagination, and filtering
router.get("/", (req, res) => {
  const search = req.query.search ? sanitize(req.query.search, 50) : "";
  const category = req.query.category ? sanitize(req.query.category, 30) : "";
  const sort = VALID_SORTS.includes(req.query.sort) ? req.query.sort : "";

  // Pagination params
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE));

  let results = products.map(enrichProduct);

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
    results = results.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (sort === "grade_asc") {
    results.sort((a, b) => a.greenGrade.score - b.greenGrade.score);
  } else if (sort === "grade_desc") {
    results.sort((a, b) => b.greenGrade.score - a.greenGrade.score);
  } else if (sort === "emissions_asc") {
    results.sort((a, b) => a.greenGrade.totalEmissions - b.greenGrade.totalEmissions);
  } else if (sort === "emissions_desc") {
    results.sort((a, b) => b.greenGrade.totalEmissions - a.greenGrade.totalEmissions);
  }

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

// GET /api/products/compare?ids=id1,id2,id3 - compare multiple products
router.get("/compare", (req, res) => {
  const idsParam = req.query.ids;
  if (!idsParam || typeof idsParam !== "string") {
    return res.status(400).json({ error: "Provide product IDs as ?ids=id1,id2,id3" });
  }

  const ids = idsParam.split(",").map((id) => sanitize(id.trim(), 20)).filter(Boolean);

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

// GET /api/products/stats - category statistics
router.get("/stats", (req, res) => {
  const enriched = products.map(enrichProduct);
  const categories = {};

  for (const p of enriched) {
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

  res.json({
    totalProducts: products.length,
    categories: stats,
  });
});

// GET /api/products/:id - single product detail
router.get("/:id", (req, res) => {
  const id = sanitize(req.params.id, 20);
  if (!validator.isAlphanumeric(id)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }
  const product = products.find((p) => p.id === id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(enrichProduct(product));
});

// GET /api/products/scan/:barcode - barcode lookup
router.get("/scan/:barcode", (req, res) => {
  const barcode = sanitize(req.params.barcode, 20);
  if (!validator.isNumeric(barcode) || barcode.length < 8 || barcode.length > 14) {
    return res.status(400).json({ error: "Invalid barcode format" });
  }
  const product = products.find((p) => p.barcode === barcode);
  if (!product) return res.status(404).json({ error: "Product not found for this barcode" });
  res.json(enrichProduct(product));
});

module.exports = router;
