const crypto = require("crypto");
const { getDb } = require("../db/schema");

const VALID_CATEGORIES = ["algorithm", "weights", "data-source", "other"];

function getMethodologyChangelog({ limit = 50, offset = 0 } = {}) {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, version, category, summary, commit_ref, changed_by, change_date
       FROM methodology_changelog
       ORDER BY change_date DESC, id DESC
       LIMIT ? OFFSET ?`
    )
    .all(limit, offset);
}

function logMethodologyChange({ version, category, summary, commitRef, changedBy = "system" }) {
  if (!VALID_CATEGORIES.includes(category)) {
    throw new Error(`Invalid category: ${category}`);
  }

  const db = getDb();
  const id = crypto.randomUUID();

  db.prepare(
    `INSERT INTO methodology_changelog (id, version, category, summary, commit_ref, changed_by)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, version, category, summary, commitRef ?? null, changedBy);

  return { id, version, category, summary, commitRef: commitRef ?? null, changedBy };
}

module.exports = { getMethodologyChangelog, logMethodologyChange, VALID_CATEGORIES };
