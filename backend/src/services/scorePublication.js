const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { getDb } = require("../db/schema");
const { logger } = require("../middleware/logger");

const METHODOLOGY_VERSION = "3.0";
const CATALOG_HASH = crypto
  .createHash("sha256")
  .update(fs.readFileSync(path.join(__dirname, "..", "data", "products.json")))
  .digest("hex");

function tierLabel(score) {
  if (score >= 7) return "green";
  if (score >= 4) return "amber";
  return "red";
}

// On first run (published_scores is empty), publish all current computed scores
// without requiring admin approval — the initial seed is the baseline.
// Returns number of products seeded (0 on subsequent runs).
function seedPublishedScores(products, scoreFn) {
  const db = getDb();
  const count = db.prepare("SELECT COUNT(*) as c FROM published_scores").get().c;
  if (count > 0) return 0;

  const stmt = db.prepare(
    `INSERT OR IGNORE INTO published_scores
       (product_id, grade, grade_label, breakdown, published_by, methodology_version, catalog_hash)
     VALUES (?, ?, ?, ?, 'system:initial-seed', ?, ?)`
  );

  const seedAll = db.transaction((ps) => {
    let seeded = 0;
    for (const p of ps) {
      const result = scoreFn(p);
      if (!result) continue;
      stmt.run(
        String(p.id),
        result.score,
        tierLabel(result.score),
        JSON.stringify(result.breakdown || []),
        METHODOLOGY_VERSION,
        CATALOG_HASH
      );
      seeded++;
    }
    return seeded;
  });

  const seeded = seedAll(products);
  if (seeded > 0) logger.info(`Score publication: seeded ${seeded} initial published scores`);
  return seeded;
}

// Compare current computed scores against published_scores. For any product
// whose score has drifted, queue one pending_score_publications row (idempotent
// — repeated calls do not create duplicate pending entries).
// Returns the count of newly-queued products.
function detectPublicationDrift(products, scoreFn) {
  const db = getDb();
  const getPublished = db.prepare("SELECT grade FROM published_scores WHERE product_id = ?");
  const hasPending = db.prepare(
    "SELECT id FROM pending_score_publications WHERE product_id = ? AND status = 'pending'"
  );
  const insert = db.prepare(
    `INSERT INTO pending_score_publications
       (product_id, product_name, old_grade, new_grade, new_breakdown)
     VALUES (?, ?, ?, ?, ?)`
  );

  let queued = 0;
  for (const p of products) {
    const result = scoreFn(p);
    if (!result) continue;

    const published = getPublished.get(String(p.id));
    if (!published) continue;

    if (Math.abs(published.grade - result.score) <= 0.001) continue;
    if (hasPending.get(String(p.id))) continue;

    insert.run(
      String(p.id),
      p.name,
      published.grade,
      result.score,
      JSON.stringify(result.breakdown || [])
    );
    queued++;
  }

  if (queued > 0) {
    logger.warn(`Score publication: ${queued} score change(s) queued for admin review`);
  }
  return queued;
}

// Return the published (admin-approved) score for a product, or null if none.
function getPublishedScore(productId) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM published_scores WHERE product_id = ?").get(String(productId));
  if (!row) return null;
  return {
    grade: row.grade,
    gradeLabel: row.grade_label,
    breakdown: JSON.parse(row.breakdown),
    publishedBy: row.published_by,
    publishedAt: row.published_at,
    methodologyVersion: row.methodology_version,
    catalogHash: row.catalog_hash,
  };
}

function getPendingPublications({ limit = 50, offset = 0 } = {}) {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM pending_score_publications
       WHERE status = 'pending'
       ORDER BY detected_at DESC LIMIT ? OFFSET ?`
    )
    .all(limit, offset);
}

function getPendingPublicationCount() {
  const db = getDb();
  return db
    .prepare("SELECT COUNT(*) as c FROM pending_score_publications WHERE status = 'pending'")
    .get().c;
}

// Approve a pending publication: update pending_score_publications and
// upsert published_scores in one transaction.
function approvePublication(id, reviewedBy, reason) {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM pending_score_publications WHERE id = ? AND status = 'pending'")
    .get(id);
  if (!row) return null;

  const doApprove = db.transaction(() => {
    db.prepare(
      `UPDATE pending_score_publications
       SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now'), review_reason = ?
       WHERE id = ?`
    ).run(reviewedBy, reason || "Approved", id);

    db.prepare(
      `INSERT INTO published_scores
         (product_id, grade, grade_label, breakdown, published_by, methodology_version, catalog_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(product_id) DO UPDATE SET
         grade = excluded.grade,
         grade_label = excluded.grade_label,
         breakdown = excluded.breakdown,
         published_by = excluded.published_by,
         published_at = datetime('now'),
         methodology_version = excluded.methodology_version,
         catalog_hash = excluded.catalog_hash`
    ).run(
      row.product_id,
      row.new_grade,
      tierLabel(row.new_grade),
      row.new_breakdown,
      reviewedBy,
      METHODOLOGY_VERSION,
      CATALOG_HASH
    );
  });

  doApprove();
  return { id, productId: row.product_id, newGrade: row.new_grade };
}

// Reject a pending publication (the published score remains unchanged).
function rejectPublication(id, reviewedBy, reason) {
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE pending_score_publications
       SET status = 'rejected', reviewed_by = ?, reviewed_at = datetime('now'), review_reason = ?
       WHERE id = ? AND status = 'pending'`
    )
    .run(reviewedBy, reason || "Rejected", id);
  return result.changes > 0;
}

module.exports = {
  seedPublishedScores,
  detectPublicationDrift,
  getPublishedScore,
  getPendingPublications,
  getPendingPublicationCount,
  approvePublication,
  rejectPublication,
};
