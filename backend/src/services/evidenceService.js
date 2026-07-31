const { getDb } = require("../db/schema");

const VALID_SOURCE_TYPES = [
  "peer_reviewed_lca",
  "lca_database",
  "manufacturer_study",
  "industry_report",
  "other",
];

function submitEvidence(productId, userId, userEmail, data) {
  const { citation, sourceType, methodology, url, year } = data;
  const info = getDb()
    .prepare(
      `INSERT INTO submitted_evidence
         (product_id, submitted_by, submitter_email, citation, source_type, methodology, url, year)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      String(productId),
      userId,
      userEmail,
      citation,
      sourceType || "other",
      methodology || null,
      url || null,
      year || null
    );
  return { id: info.lastInsertRowid };
}

function getApprovedEvidence(productId) {
  return getDb()
    .prepare(
      `SELECT id, citation, source_type, methodology, url, year, submitted_at
       FROM submitted_evidence
       WHERE product_id = ? AND status = 'approved'
       ORDER BY submitted_at DESC`
    )
    .all(String(productId));
}

function getPendingEvidence({ limit = 50, offset = 0 } = {}) {
  return getDb()
    .prepare(
      `SELECT id, product_id, submitter_email, citation, source_type, methodology, url, year, submitted_at
       FROM submitted_evidence
       WHERE status = 'pending'
       ORDER BY submitted_at ASC
       LIMIT ? OFFSET ?`
    )
    .all(limit, offset);
}

function reviewEvidence(id, reviewerId, status, notes) {
  const info = getDb()
    .prepare(
      `UPDATE submitted_evidence
       SET status = ?, reviewer_id = ?, reviewer_notes = ?, reviewed_at = datetime('now')
       WHERE id = ? AND status = 'pending'`
    )
    .run(status, reviewerId, notes || null, id);
  return info.changes > 0;
}

module.exports = {
  submitEvidence,
  getApprovedEvidence,
  getPendingEvidence,
  reviewEvidence,
  VALID_SOURCE_TYPES,
};
