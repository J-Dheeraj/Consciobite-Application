const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const validator = require("validator");
const router = express.Router();
const { validate } = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const products = require("../data/products.json");
const { calculateGreenGrade } = require("../services/greengrade");
const { getDb } = require("../db/schema");

const CATALOG_HASH = crypto
  .createHash("sha256")
  .update(fs.readFileSync(path.join(__dirname, "..", "data", "products.json")))
  .digest("hex");
const METHODOLOGY_VERSION = "3.0";

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
    methodology_version: METHODOLOGY_VERSION,
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

// POST /portfolio/export
// Auth-required B2B export: returns a structured JSON or CSV report for
// Scope 3 / ESPR regulatory submission.

const EXPORT_SCHEMA = {
  body: {
    product_ids: { required: true, message: "product_ids is required" },
  },
};

function scoreTier(score) {
  if (score >= 7) return "green";
  if (score >= 4) return "amber";
  return "red";
}

function buildCsvRow(p) {
  const e = p.emission_breakdown;
  const name = `"${String(p.product_name).replace(/"/g, '""')}"`;
  const brand = `"${String(p.brand).replace(/"/g, '""')}"`;
  return [
    p.product_id,
    name,
    brand,
    p.category,
    p.greengrade_score,
    scoreTier(p.greengrade_score),
    p.total_carbon_footprint_kg_co2e,
    e.land_use_change,
    e.animal_feed,
    e.farm_operations,
    e.processing,
    e.transport,
    e.packaging,
    e.retail,
    p.data_confidence_tier ?? "",
    p.score_percentile ?? "",
  ].join(",");
}

router.post("/portfolio/export", requireAuth, validate(EXPORT_SCHEMA), (req, res) => {
  const { product_ids, format = "json", report_title } = req.body;

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
  if (format !== "json" && format !== "csv") {
    return res.status(400).json({ error: "format must be 'json' or 'csv'" });
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
  const totalEmissions = passports.reduce((s, p) => s + p.total_carbon_footprint_kg_co2e, 0);
  const avgScore = Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10;
  const avgEmissions = Math.round((totalEmissions / passports.length) * 1000) / 1000;

  const categoryMap = {};
  let greenCount = 0;
  let amberCount = 0;
  let redCount = 0;
  for (const p of passports) {
    const tier = scoreTier(p.greengrade_score);
    if (tier === "green") greenCount++;
    else if (tier === "amber") amberCount++;
    else redCount++;
    if (!categoryMap[p.category]) {
      categoryMap[p.category] = { count: 0, totalScore: 0, totalEmissions: 0 };
    }
    categoryMap[p.category].count++;
    categoryMap[p.category].totalScore += p.greengrade_score;
    categoryMap[p.category].totalEmissions += p.total_carbon_footprint_kg_co2e;
  }

  const category_breakdown = Object.entries(categoryMap).map(([category, data]) => ({
    category,
    product_count: data.count,
    avg_greengrade_score: Math.round((data.totalScore / data.count) * 10) / 10,
    avg_emissions_kg_co2e: Math.round((data.totalEmissions / data.count) * 1000) / 1000,
  }));

  const dateStr = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const csvHeader =
      "product_id,product_name,brand,category,greengrade_score,score_tier," +
      "total_emissions_kg_co2e,land_use_change,animal_feed,farm_operations," +
      "processing,transport,packaging,retail,data_confidence_tier,score_percentile";
    const rows = passports.map(buildCsvRow);
    const csv = [csvHeader, ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="portfolio-report-${dateStr}.csv"`
    );
    return res.send(csv);
  }

  res.json({
    report_title: report_title ? String(report_title).slice(0, 200) : `Portfolio Report ${dateStr}`,
    generated_at: new Date().toISOString(),
    generated_by: req.user.email,
    methodology_version: METHODOLOGY_VERSION,
    catalog_hash: `sha256:${CATALOG_HASH}`,
    reporting_standard: "EU ESPR Article 7 / SGX Climate-related Disclosures",
    portfolio_summary: {
      product_count: passports.length,
      average_greengrade_score: avgScore,
      total_emissions_kg_co2e: Math.round(totalEmissions * 1000) / 1000,
      average_emissions_per_product: avgEmissions,
      green_products: greenCount,
      amber_products: amberCount,
      red_products: redCount,
    },
    category_breakdown,
    products: passports,
  });
});

module.exports = router;
