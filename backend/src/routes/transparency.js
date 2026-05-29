const express = require("express");
const { getConflictStats } = require("../services/scoreAudit");
const { getDb } = require("../db/schema");
const products = require("../data/products.json");

const router = express.Router();

const ADVISORY_BOARD = [
  {
    seat: "Academic",
    title: "Sustainability & Food Systems Researcher",
    affiliation: "To be appointed — outreach in progress",
    mandate: "Annual methodology audit; sign-off on scoring parameter changes",
    status: "pending",
  },
  {
    seat: "Regulator",
    title: "Food Safety & Environmental Standards",
    affiliation: "Singapore Food Agency (SFA) — nomination pending",
    mandate: "Regulatory alignment; published audit summary",
    status: "pending",
  },
  {
    seat: "Industry",
    title: "Non-Client Industry Representative",
    affiliation: "To be appointed — must not be a paying Consciobite client",
    mandate: "Practical relevance; conflict-of-interest register",
    status: "pending",
  },
];

router.get("/", (_req, res) => {
  const stats = getConflictStats();
  const db = getDb();

  const scoredCount = db.prepare("SELECT COUNT(*) AS count FROM product_scores").get();

  const lastAudit = db.prepare("SELECT MAX(changed_at) AS ts FROM score_change_logs").get();

  res.json({
    governance: {
      advisoryBoard: {
        formed: false,
        mandate:
          "Annual methodology audit, sign-off on scoring parameter changes, published audit summary, and conflict-of-interest register",
        members: ADVISORY_BOARD,
      },
      commitments: [
        "GreenGrade scores are calculated by a deterministic algorithm — no manual overrides",
        "Every score change is logged in a tamper-evident audit trail with paying/non-paying status recorded",
        "Advisory board members must declare any financial relationship with Consciobite or listed manufacturers",
        "Aggregate score impartiality statistics are published publicly (this page)",
        "Full scoring methodology and data sources are documented at /methodology",
      ],
    },
    scoreImpartiality: {
      description:
        "Score changes over the past 12 months, broken down by whether the manufacturer is a paying Consciobite client.",
      note: "A well-functioning grading system should show similar average score movement for paying and non-paying manufacturers.",
      totalChanges: stats.totalChanges,
      paying: stats.paying,
      nonPaying: stats.nonPaying,
      lastAuditTimestamp: lastAudit?.ts ?? null,
    },
    catalog: {
      totalProducts: products.length,
      scoredProducts: scoredCount?.count ?? 0,
    },
    updatedAt: new Date().toISOString(),
  });
});

module.exports = router;
