const crypto = require("crypto");
const { getDb } = require("../db/schema");
const { logger } = require("../middleware/logger");

const INSERT_LOG = `
  INSERT INTO score_change_logs
    (id, product_id, product_name, manufacturer_id, is_paying_client,
     old_score, new_score, score_delta, changed_by, change_reason)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const UPSERT_SNAPSHOT = `
  INSERT INTO product_scores (product_id, score, scored_at)
  VALUES (?, ?, datetime('now'))
  ON CONFLICT(product_id) DO UPDATE SET score = excluded.score, scored_at = excluded.scored_at
`;

const GET_MANUFACTURER = `
  SELECT m.id, m.is_paying
  FROM product_manufacturers pm
  JOIN manufacturers m ON m.id = pm.manufacturer_id
  WHERE pm.product_id = ?
`;

const GET_SNAPSHOT = `SELECT score FROM product_scores WHERE product_id = ?`;

function logScoreChange({
  productId,
  productName,
  oldScore,
  newScore,
  changedBy = "system",
  changeReason,
}) {
  if (oldScore === newScore) return;

  const db = getDb();
  const mfr = db.prepare(GET_MANUFACTURER).get(productId);

  db.prepare(INSERT_LOG).run(
    crypto.randomUUID(),
    productId,
    productName,
    mfr?.id ?? null,
    mfr?.is_paying ? 1 : 0,
    oldScore,
    newScore,
    parseFloat((newScore - oldScore).toFixed(4)),
    changedBy,
    changeReason ?? null
  );

  db.prepare(UPSERT_SNAPSHOT).run(productId, newScore);
}

function snapshotScores(products, scoreFn) {
  const db = getDb();
  const getSnap = db.prepare(GET_SNAPSHOT);
  const changes = [];

  for (const product of products) {
    const result = scoreFn(product);
    if (!result) continue;

    const newScore = result.score;
    const existing = getSnap.get(String(product.id));
    const oldScore = existing?.score ?? null;

    if (oldScore !== null && oldScore !== newScore) {
      logScoreChange({
        productId: String(product.id),
        productName: product.name,
        oldScore,
        newScore,
        changedBy: "system",
        changeReason: "Model retrain / algorithm update",
      });
      changes.push({ productId: product.id, name: product.name, oldScore, newScore });
    } else if (oldScore === null) {
      db.prepare(UPSERT_SNAPSHOT).run(String(product.id), newScore);
    }
  }

  if (changes.length > 0) {
    logger.info(`Score audit: ${changes.length} score change(s) detected and logged`);
  }

  return changes;
}

function getConflictLog({ filter, limit = 200, offset = 0 } = {}) {
  const db = getDb();
  let where = "";
  const params = [];

  if (filter === "paying") {
    where = "WHERE is_paying_client = 1";
  } else if (filter === "non-paying") {
    where = "WHERE is_paying_client = 0";
  }

  const rows = db
    .prepare(
      `SELECT * FROM score_change_logs ${where}
       ORDER BY changed_at DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset);

  return rows;
}

function getConflictStats() {
  const db = getDb();
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

  const total = db
    .prepare("SELECT COUNT(*) as count FROM score_change_logs WHERE changed_at >= ?")
    .get(cutoff);

  const byPaying = db
    .prepare(
      `SELECT
         is_paying_client,
         COUNT(*) as count,
         AVG(score_delta) as avg_delta,
         SUM(CASE WHEN score_delta > 0 THEN 1 ELSE 0 END) as increases,
         SUM(CASE WHEN score_delta < 0 THEN 1 ELSE 0 END) as decreases
       FROM score_change_logs
       WHERE changed_at >= ?
       GROUP BY is_paying_client`
    )
    .all(cutoff);

  const paying = byPaying.find((r) => r.is_paying_client === 1) || {
    count: 0,
    avg_delta: 0,
    increases: 0,
    decreases: 0,
  };
  const nonPaying = byPaying.find((r) => r.is_paying_client === 0) || {
    count: 0,
    avg_delta: 0,
    increases: 0,
    decreases: 0,
  };

  return {
    totalChanges: total.count,
    paying: {
      count: paying.count,
      avgDelta: parseFloat((paying.avg_delta || 0).toFixed(4)),
      increases: paying.increases,
      decreases: paying.decreases,
    },
    nonPaying: {
      count: nonPaying.count,
      avgDelta: parseFloat((nonPaying.avg_delta || 0).toFixed(4)),
      increases: nonPaying.increases,
      decreases: nonPaying.decreases,
    },
  };
}

const ADVISORY_BOARD = {
  status: "pending_formation",
  seats: [
    {
      role: "Academic",
      description: "Sustainability or food-science researcher",
      status: "vacant",
    },
    {
      role: "Regulator",
      description: "Civil servant (e.g. Singapore Food Agency)",
      status: "vacant",
    },
    {
      role: "Industry",
      description: "Industry professional — not a paying client",
      status: "vacant",
    },
  ],
  mandate: [
    "Annual methodology audit",
    "Sign-off on scoring parameter changes",
    "Published audit summary",
    "Conflict-of-interest register",
  ],
};

function getTransparencyData() {
  const stats = getConflictStats();
  const recentChanges = getConflictLog({ limit: 10 });

  const payingDelta = stats.paying.avgDelta;
  const nonPayingDelta = stats.nonPaying.avgDelta;
  const biasDelta = Math.abs(payingDelta - nonPayingDelta);
  const biasFlag = stats.paying.count + stats.nonPaying.count > 0 && biasDelta > 0.5;

  return {
    lastUpdated: new Date().toISOString(),
    algorithm: {
      version: "3.0",
      description:
        "GreenGrade v3 — Gaussian KDE + sigmoid normalization across 7 lifecycle emission dimensions.",
    },
    advisoryBoard: ADVISORY_BOARD,
    scoreIntegrity: {
      stats,
      biasFlag,
      biasDelta: parseFloat(biasDelta.toFixed(4)),
      biasMessage: biasFlag
        ? "Score delta difference between paying and non-paying clients exceeds 0.5 — review recommended."
        : "No significant bias detected between paying and non-paying client score changes.",
      recentChanges: recentChanges.map((row) => ({
        productName: row.product_name,
        oldScore: row.old_score,
        newScore: row.new_score,
        delta: row.score_delta,
        isPayingClient: !!row.is_paying_client,
        changedAt: row.changed_at,
        changedBy: row.changed_by,
        changeReason: row.change_reason,
      })),
    },
  };
}

module.exports = {
  logScoreChange,
  snapshotScores,
  getConflictLog,
  getConflictStats,
  getTransparencyData,
};
