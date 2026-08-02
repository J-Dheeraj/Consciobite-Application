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

// GET /portfolio/export

const EXPORT_SCHEMA = {
  query: {
    ids: {
      required: false,
      type: "string",
      maxLength: 500,
      message: "ids must be a comma-separated list of product IDs",
    },
    category: {
      required: false,
      type: "string",
      maxLength: 50,
      message: "category must be a string",
    },
    format: {
      required: false,
      type: "string",
      maxLength: 4,
      message: "format must be csv or json",
    },
  },
};

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function passportsToCSV(passports) {
  const header = [
    "Product ID",
    "Product Name",
    "Brand",
    "Category",
    "GreenGrade Score",
    "Score Percentile",
    "Data Confidence Tier",
    "Data Confidence Label",
    "Total Carbon Footprint (kg CO2e)",
    "Land Use Change (kg CO2e)",
    "Animal Feed (kg CO2e)",
    "Farm Operations (kg CO2e)",
    "Processing (kg CO2e)",
    "Transport (kg CO2e)",
    "Packaging (kg CO2e)",
    "Retail (kg CO2e)",
    "Methodology Version",
    "Passport Generated At",
  ].join(",");

  const rows = passports.map((p) =>
    [
      csvEscape(p.product_id),
      csvEscape(p.product_name),
      csvEscape(p.brand),
      csvEscape(p.category),
      csvEscape(p.greengrade_score),
      csvEscape(p.score_percentile),
      csvEscape(p.data_confidence_tier),
      csvEscape(p.data_confidence_label),
      csvEscape(p.total_carbon_footprint_kg_co2e),
      csvEscape(p.emission_breakdown.land_use_change),
      csvEscape(p.emission_breakdown.animal_feed),
      csvEscape(p.emission_breakdown.farm_operations),
      csvEscape(p.emission_breakdown.processing),
      csvEscape(p.emission_breakdown.transport),
      csvEscape(p.emission_breakdown.packaging),
      csvEscape(p.emission_breakdown.retail),
      csvEscape(p.methodology_version),
      csvEscape(p.passport_generated_at),
    ].join(",")
  );

  return [header, ...rows].join("\n");
}

router.get("/portfolio/export", validate(EXPORT_SCHEMA), (req, res) => {
  const { ids, category, format = "csv" } = req.query;

  if (format !== "csv" && format !== "json") {
    return res.status(400).json({ error: "format must be csv or json" });
  }

  if (!ids && !category) {
    return res.status(400).json({ error: "Provide ids or category query parameter" });
  }

  if (ids && category) {
    return res.status(400).json({ error: "Provide either ids or category, not both" });
  }

  let selected = [];

  if (ids) {
    const rawIds = ids
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 100);

    for (const rawId of rawIds) {
      const id = sanitize(rawId, 20);
      if (!validator.isAlphanumeric(id)) continue;
      const product = products.find((p) => String(p.id) === id);
      if (product) selected.push(product);
    }
  } else {
    const cat = sanitize(category, 50);
    selected = products.filter(
      (p) => typeof p.category === "string" && p.category.toLowerCase() === cat.toLowerCase()
    );
    selected = selected.slice(0, 100);
  }

  if (selected.length === 0) {
    return res.status(404).json({ error: "No matching products found" });
  }

  const passports = selected.map(buildPassport);

  if (format === "json") {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", 'attachment; filename="portfolio-export.json"');
    return res.json({ products: passports, product_count: passports.length });
  }

  const csv = passportsToCSV(passports);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="portfolio-export.csv"');
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
