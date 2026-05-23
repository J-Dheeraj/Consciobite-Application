const express = require("express");
const { getConflictStats } = require("../services/scoreAudit");
const { getMethodology } = require("../services/dataProvenance");

const router = express.Router();

const ADVISORY_BOARD = {
  status: "forming",
  description:
    "An independent advisory board is being established to audit the GreenGrade methodology and provide oversight of scoring independence.",
  seats: [
    {
      role: "Academic",
      mandate: "Sustainability or food-science researcher providing scientific credibility",
      filled: false,
    },
    {
      role: "Regulatory",
      mandate:
        "Civil servant or regulatory body representative (e.g. Singapore Food Agency) providing regulatory legitimacy",
      filled: false,
    },
    {
      role: "Industry",
      mandate:
        "Industry professional who is NOT a paying Consciobite client, providing practical relevance without conflict",
      filled: false,
    },
  ],
  mandate: [
    "Annual audit of GreenGrade methodology",
    "Sign-off on scoring parameter changes",
    "Published audit summary",
    "Conflict-of-interest register for board members",
  ],
};

const GOVERNANCE_COMMITMENTS = [
  {
    commitment: "Scoring independence",
    detail:
      "GreenGrade scores are computed by a deterministic algorithm (KDE + sigmoid). Manufacturer listing fees do not influence score outcomes.",
  },
  {
    commitment: "Audit trail",
    detail:
      "Every score change — whether from algorithm updates, data corrections, or model retraining — is logged with a timestamp and reason. Paying vs. non-paying client attribution is recorded for every change.",
  },
  {
    commitment: "Methodology transparency",
    detail:
      "The full scoring algorithm, data sources, confidence formula, and known limitations are publicly documented at /methodology.",
  },
  {
    commitment: "Advisory oversight",
    detail:
      "An independent advisory board (forming) will audit the methodology annually and sign off on parameter changes. Board composition and findings will be publicly disclosed.",
  },
];

router.get("/", (_req, res) => {
  const methodology = getMethodology();
  let auditStats = null;

  try {
    auditStats = getConflictStats();
  } catch {
    // DB might not be initialised in some environments; return nulls gracefully
  }

  res.json({
    methodologyVersion: methodology.version,
    governanceCommitments: GOVERNANCE_COMMITMENTS,
    advisoryBoard: ADVISORY_BOARD,
    auditStats: auditStats
      ? {
          totalScoreChanges: auditStats.totalChanges,
          payingClients: {
            changes: auditStats.paying.count,
            avgDelta: auditStats.paying.avgDelta,
            increases: auditStats.paying.increases,
            decreases: auditStats.paying.decreases,
          },
          nonPayingClients: {
            changes: auditStats.nonPaying.count,
            avgDelta: auditStats.nonPaying.avgDelta,
            increases: auditStats.nonPaying.increases,
            decreases: auditStats.nonPaying.decreases,
          },
        }
      : null,
    lastUpdated: new Date().toISOString().split("T")[0],
  });
});

module.exports = router;
