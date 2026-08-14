const express = require("express");
const validator = require("validator");
const router = express.Router();
const { validate } = require("../middleware/validate");
const products = require("../data/products.json");
const { calculateGreenGrade } = require("../services/greengrade");
const { getDb } = require("../db/schema");

function enrichProduct(product) {
  const grade = calculateGreenGrade(product.emissions, product.category, product);
  return { ...product, greenGrade: grade };
}

function sanitize(str, maxLen = 100) {
  if (typeof str !== "string") return "";
  return validator.escape(validator.trim(str)).slice(0, maxLen);
}

function buildPassport(product) {
  const enriched = enrichProduct(product);
  const g = enriched.greenGrade;

  return {
    product_id: String(product.id),
    product_name: product.name,
    brand: product.brand,
    category: product.category,
    greengrade_score: g.score,
    score_percentile: g.percentile,
    emission_breakdown: {
      land_use_change: product.emissions.landUseChange,
      animal_feed: product.emissions.animalFeed,
      farm_operations: product.emissions.farm,
      processing: product.emissions.processing,
      transport: product.emissions.transport,
      packaging: product.emissions.packaging,
      retail: product.emissions.retail,
    },
    total_carbon_footprint_kg_co2e: g.totalEmissions,
    data_confidence_tier: g.dataTier ?? null,
    data_confidence_label: g.dataTierLabel ?? null,
    passport_generated_at: new Date().toISOString(),
    methodology_version: "3.0",
  };
}

// GET /passport/:productId
router.get("/passport/:productId", (req, res) => {
  const id = sanitize(req.params.productId, 20);

  if (!validator.isAlphanumeric(id)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  const product = products.find((p) => String(p.id) === id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  res.json(buildPassport(product));
});

// POST /portfolio/score

const PORTFOLIO_SCHEMA = {
  body: {
    product_ids: { required: true, message: "product_ids is required" },
  },
};

router.post("/portfolio/score", validate(PORTFOLIO_SCHEMA), (req, res) => {
  const { product_ids } = req.body;

  if (!Array.isArray(product_ids)) {
    return res.status(400).json({ error: "product_ids must be an array" });
  }

  if (product_ids.length < 1 || product_ids.length > 100) {
    return res.status(400).json({ error: "product_ids must contain between 1 and 100 items" });
  }

  for (const id of product_ids) {
    if (typeof id !== "string") {
      return res.status(400).json({ error: "Each product_ids entry must be a string" });
    }
  }

  const passports = [];
  for (const rawId of product_ids) {
    const id = sanitize(rawId, 20);
    if (!validator.isAlphanumeric(id)) continue;
    const product = products.find((p) => String(p.id) === id);
    if (!product) continue;
    passports.push(buildPassport(product));
  }

  if (passports.length === 0) {
    return res.status(404).json({ error: "No valid products found for the provided IDs" });
  }

  const scores = passports.map((p) => p.greengrade_score);
  const avgScore = Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10;

  let highest = passports[0];
  let lowest = passports[0];
  for (const p of passports) {
    if (p.greengrade_score > highest.greengrade_score) highest = p;
    if (p.greengrade_score < lowest.greengrade_score) lowest = p;
  }

  const categoryMap = {};
  for (const p of passports) {
    if (!categoryMap[p.category]) {
      categoryMap[p.category] = { count: 0, totalScore: 0, totalEmissions: 0 };
    }
    categoryMap[p.category].count++;
    categoryMap[p.category].totalScore += p.greengrade_score;
    categoryMap[p.category].totalEmissions += p.total_carbon_footprint_kg_co2e;
  }

  const category_benchmarks = Object.entries(categoryMap).map(([category, data]) => ({
    category,
    count: data.count,
    avg_score: Math.round((data.totalScore / data.count) * 10) / 10,
    avg_emissions: Math.round((data.totalEmissions / data.count) * 100) / 100,
  }));

  res.json({
    products: passports,
    portfolio_summary: {
      average_score: avgScore,
      product_count: passports.length,
      highest: {
        id: highest.product_id,
        name: highest.product_name,
        score: highest.greengrade_score,
      },
      lowest: { id: lowest.product_id, name: lowest.product_name, score: lowest.greengrade_score },
    },
    category_benchmarks,
  });
});

// GET /portfolio/export?ids=1,2,3
// Returns an RFC 4180 CSV of Digital Product Passports for up to 100 products.

const CSV_HEADERS = [
  "product_id",
  "product_name",
  "brand",
  "category",
  "greengrade_score",
  "score_percentile",
  "emissions_land_use_change_kg_co2e",
  "emissions_animal_feed_kg_co2e",
  "emissions_farm_operations_kg_co2e",
  "emissions_processing_kg_co2e",
  "emissions_transport_kg_co2e",
  "emissions_packaging_kg_co2e",
  "emissions_retail_kg_co2e",
  "total_carbon_footprint_kg_co2e",
  "data_confidence_tier",
  "data_confidence_label",
  "methodology_version",
  "passport_generated_at",
].join(",");

function csvEscape(value) {
  const str = String(value ?? "");
  if (/[,"\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function buildCsvRow(p) {
  return [
    p.product_id,
    p.product_name,
    p.brand,
    p.category,
    p.greengrade_score,
    p.score_percentile,
    p.emission_breakdown.land_use_change,
    p.emission_breakdown.animal_feed,
    p.emission_breakdown.farm_operations,
    p.emission_breakdown.processing,
    p.emission_breakdown.transport,
    p.emission_breakdown.packaging,
    p.emission_breakdown.retail,
    p.total_carbon_footprint_kg_co2e,
    p.data_confidence_tier ?? "",
    p.data_confidence_label ?? "",
    p.methodology_version,
    p.passport_generated_at,
  ]
    .map(csvEscape)
    .join(",");
}

const EXPORT_SCHEMA = {
  query: {
    ids: { required: true, message: "ids query parameter is required" },
  },
};

router.get("/portfolio/export", validate(EXPORT_SCHEMA), (req, res) => {
  const rawIds = String(req.query.ids)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (rawIds.length < 1 || rawIds.length > 100) {
    return res
      .status(400)
      .json({ error: "ids must contain between 1 and 100 comma-separated product IDs" });
  }

  const passports = [];
  for (const rawId of rawIds) {
    const id = sanitize(rawId, 20);
    if (!validator.isAlphanumeric(id)) continue;
    const product = products.find((p) => String(p.id) === id);
    if (!product) continue;
    passports.push(buildPassport(product));
  }

  if (passports.length === 0) {
    return res.status(404).json({ error: "No valid products found for the provided IDs" });
  }

  const rows = [CSV_HEADERS, ...passports.map(buildCsvRow)];
  const csv = rows.join("\r\n") + "\r\n";
  const date = new Date().toISOString().slice(0, 10);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="dpp-portfolio-${date}.csv"`);
  res.send(csv);
});

// GET /audit/:productId

const AUDIT_SCHEMA = {
  query: {
    limit: {
      required: false,
      type: "string",
      pattern: /^\d+$/,
      message: "limit must be a positive integer",
    },
    offset: {
      required: false,
      type: "string",
      pattern: /^\d+$/,
      message: "offset must be a positive integer",
    },
  },
};

router.get("/audit/:productId", validate(AUDIT_SCHEMA), (req, res) => {
  const id = sanitize(req.params.productId, 20);

  if (!validator.isAlphanumeric(id)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  const product = products.find((p) => String(p.id) === id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  const limit = Math.min(parseInt(req.query.limit) || 50, 500);
  const offset = parseInt(req.query.offset) || 0;

  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM score_change_logs WHERE product_id = ? ORDER BY changed_at DESC LIMIT ? OFFSET ?"
    )
    .all(String(product.id), limit, offset);

  const total = db
    .prepare("SELECT COUNT(*) as count FROM score_change_logs WHERE product_id = ?")
    .get(String(product.id));

  res.json({
    product_id: String(product.id),
    product_name: product.name,
    audit_entries: rows,
    total_entries: total.count,
  });
});

module.exports = router;
