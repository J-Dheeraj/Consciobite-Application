const express = require("express");
const { getDb } = require("../db/schema");
const { getConflictStats } = require("../services/scoreAudit");
const { calculateGreenGrade } = require("../services/greengrade");
const products = require("../data/products.json");

const router = express.Router();

function getScoreDistribution() {
  const db = getDb();
  const rows = db.prepare("SELECT score FROM product_scores").all();

  const dist = { green: 0, yellow: 0, red: 0 };

  if (rows.length === 0) {
    for (const product of products) {
      const result = calculateGreenGrade(product.emissions, product.category, product);
      if (result) dist[result.color]++;
    }
    return { ...dist, total: products.length };
  }

  for (const row of rows) {
    if (row.score >= 7) dist.green++;
    else if (row.score >= 4) dist.yellow++;
    else dist.red++;
  }

  return { ...dist, total: products.length };
}

function biasIndicator(paying, nonPaying) {
  if (paying.count === 0 && nonPaying.count === 0) return "insufficient_data";
  if (paying.count === 0) return "no_paying_changes";
  const delta = Math.abs((paying.avgDelta || 0) - (nonPaying.avgDelta || 0));
  if (delta < 0.1) return "none";
  if (delta < 0.5) return "low";
  if (delta < 1.0) return "moderate";
  return "high";
}

router.get("/", (_req, res) => {
  const conflictStats = getConflictStats();
  const distribution = getScoreDistribution();

  res.json({
    lastUpdated: new Date().toISOString().split("T")[0],
    methodologyVersion: "3.0",
    totalProductsScored: distribution.total,
    scoreDistribution: {
      green: distribution.green,
      yellow: distribution.yellow,
      red: distribution.red,
    },
    biasAnalysis: {
      period: "last 12 months",
      note: "Compares aggregate scoring patterns between paying and non-paying client products. No individual product data is disclosed.",
      totalChanges: conflictStats.totalChanges,
      payingClients: {
        changes: conflictStats.paying.count,
        avgScoreDelta: conflictStats.paying.avgDelta,
        increases: conflictStats.paying.increases,
        decreases: conflictStats.paying.decreases,
      },
      nonPayingClients: {
        changes: conflictStats.nonPaying.count,
        avgScoreDelta: conflictStats.nonPaying.avgDelta,
        increases: conflictStats.nonPaying.increases,
        decreases: conflictStats.nonPaying.decreases,
      },
      biasIndicator: biasIndicator(conflictStats.paying, conflictStats.nonPaying),
    },
    advisoryBoard: {
      status: "formation",
      note: "The Independent Grading Advisory Board is being constituted. Members and their conflict-of-interest declarations will be published here upon appointment.",
      mandate: [
        "Annual methodology audit and sign-off on scoring parameter changes",
        "Published audit summary (annually)",
        "Conflict-of-interest register maintenance",
        "Review of any bias flagged in scoring statistics",
      ],
      targetFormation: "Q3 2026",
      seats: [
        {
          role: "Academic",
          description: "Sustainability or food-science researcher",
          status: "open",
        },
        {
          role: "Regulator",
          description: "Civil servant from a relevant food safety authority",
          status: "open",
        },
        {
          role: "Industry",
          description: "Industry professional with no commercial relationship with Consciobite",
          status: "open",
        },
      ],
    },
    commitments: [
      "GreenGrade scores are computed algorithmically — no manual overrides permitted",
      "All score changes are logged with timestamps and paying-client flags",
      "Aggregate bias statistics are published publicly and updated in real time",
      "Advisory board members will have no commercial relationship with Consciobite",
      "Scoring methodology source code will be open-sourced by Q4 2026",
    ],
  });
});

module.exports = router;
