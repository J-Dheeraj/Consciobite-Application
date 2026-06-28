const crypto = require("crypto");
const { getDb } = require("../db/schema");

function deserialize(row) {
  return { ...row, changed_params: row.changed_params ? JSON.parse(row.changed_params) : null };
}

function getCurrentVersion() {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM methodology_versions ORDER BY released_at DESC, id DESC LIMIT 1")
    .get();
  return row ? deserialize(row) : null;
}

function getChangelog({ limit = 50, offset = 0 } = {}) {
  const db = getDb();
  const entries = db
    .prepare("SELECT * FROM methodology_versions ORDER BY released_at DESC LIMIT ? OFFSET ?")
    .all(limit, offset)
    .map(deserialize);
  const total = db.prepare("SELECT COUNT(*) as count FROM methodology_versions").get();

  return { entries, totalEntries: total.count };
}

function recordVersion({ version, summary, changedParams, releasedBy = "system" }) {
  const db = getDb();
  const id = crypto.randomUUID();

  db.prepare(
    `INSERT INTO methodology_versions (id, version, summary, changed_params, released_by)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, version, summary, changedParams ? JSON.stringify(changedParams) : null, releasedBy);

  return getCurrentVersion();
}

module.exports = { getCurrentVersion, getChangelog, recordVersion };
