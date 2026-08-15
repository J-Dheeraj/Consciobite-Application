const express = require("express");
const crypto = require("crypto");
const validator = require("validator");
const router = express.Router();
const products = require("../data/products.json");
const { calculateGreenGrade } = require("../services/greengrade");

// Pre-compute catalog hash once — products.json is immutable at runtime.
const CATALOG_HASH = crypto
  .createHash("sha256")
  .update(JSON.stringify(products))
  .digest("hex");

const METHODOLOGY_VERSION = "3.0";

const VALID_FORMATS = ["json", "csv"];
const VALID_TIERS = ["green", "amber", "red"];

function scoreTier(score) {
  if (score >= 7) return "green";
  if (score >= 4) return "amber";
  return "red";
}

function buildExportRow(product) {
  const grade = calculateGreenGrade(product.emissions, product.category, product);
  return {
    id: String(product.id),
    name: product.name,
    brand: product.brand,
    category: product.category,
    greengrade_score: grade.score,
    score_tier: scoreTier(grade.score),
    score_percentile: grade.percentile ?? null,
    total_carbon_footprint_kg_co2e: grade.totalEmissions,
    emission_breakdown: {
      land_use_change: product.emissions.landUseChange,
      animal_feed: product.emissions.animalFeed,
      farm_operations: product.emissions.farm,
      processing: product.emissions.processing,
      transport: product.emissions.transport,
      packaging: product.emissions.packaging,
      retail: product.emissions.retail,
    },
    data_confidence_tier: grade.dataTier ?? null,
    data_confidence_label: grade.dataTierLabel ?? null,
  };
}

// Build the full enriched catalog once per process life (products.json is static).
// This avoids re-scoring 550 products on every export request.
let cachedRows = null;
function getEnrichedRows() {
  if (!cachedRows) {
    cachedRows = products.map(buildExportRow);
  }
  return cachedRows;
}

function toCsv(rows, generatedAt) {
  const HEADER =
    "ID,Name,Brand,Category,GreenGrade Score,Score Tier,Score Percentile," +
    "Total CO2e (kg),Land Use Change (kg),Animal Feed (kg),Farm (kg)," +
    "Processing (kg),Transport (kg),Packaging (kg),Retail (kg)," +
    "Data Confidence Tier,Data Confidence Label,Methodology Version,Generated At";

  const escape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const dataRows = rows.map((r) =>
    [
      r.id,
      escape(r.name),
      escape(r.brand),
      escape(r.category),
      r.greengrade_score,
      r.score_tier,
      r.score_percentile ?? "",
      r.total_carbon_footprint_kg_co2e,
      r.emission_breakdown.land_use_change,
      r.emission_breakdown.animal_feed,
      r.emission_breakdown.farm_operations,
      r.emission_breakdown.processing,
      r.emission_breakdown.transport,
      r.emission_breakdown.packaging,
      r.emission_breakdown.retail,
      r.data_confidence_tier ?? "",
      r.data_confidence_label ?? "",
      METHODOLOGY_VERSION,
      generatedAt,
    ].join(",")
  );

  return [HEADER, ...dataRows].join("\r\n");
}

// GET /api/v1/export/catalog
// Returns the full product catalog with GreenGrade scores in JSON or CSV.
// Optional filters: ?format=json|csv  ?category=<name>  ?tier=green|amber|red
router.get("/catalog", (req, res) => {
  const format = VALID_FORMATS.includes(req.query.format) ? req.query.format : "json";
  const categoryFilter = req.query.category
    ? validator.escape(validator.trim(String(req.query.category))).slice(0, 50)
    : "";
  const tierFilter = VALID_TIERS.includes(req.query.tier) ? req.query.tier : "";

  let rows = getEnrichedRows();

  if (categoryFilter) {
    const q = categoryFilter.toLowerCase();
    rows = rows.filter((r) => r.category.toLowerCase() === q);
  }

  if (tierFilter) {
    rows = rows.filter((r) => r.score_tier === tierFilter);
  }

  const generatedAt = new Date().toISOString();

  res.setHeader("X-Catalog-Sha256", CATALOG_HASH);
  res.setHeader("X-Methodology-Version", METHODOLOGY_VERSION);

  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="consciobite-catalog.csv"'
    );
    return res.send(toCsv(rows, generatedAt));
  }

  res.json({
    metadata: {
      generated_at: generatedAt,
      methodology_version: METHODOLOGY_VERSION,
      catalog_hash: CATALOG_HASH,
      product_count: rows.length,
      filters: {
        category: categoryFilter || null,
        tier: tierFilter || null,
      },
    },
    products: rows,
  });
});

module.exports = router;
