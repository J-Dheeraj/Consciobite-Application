const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { getDb } = require("../db/schema");
const { logger } = require("../middleware/logger");

// Provenance bound into every score-change record: the methodology version,
// a hash of the exact catalog the score was computed from, and the deployed
// code revision. Resolved once at module load.
const METHODOLOGY_VERSION = "3.0";
const CATALOG_HASH = crypto
  .createHash("sha256")
  .update(fs.readFileSync(path.join(__dirname, "..", "data", "products.json")))
  .digest("hex");
const CODE_REVISION =
  process.env.RENDER_GIT_COMMIT || process.env.GIT_SHA || process.env.SOURCE_VERSION || "unknown";

// ---------- Tamper-evident chain (T-6) ----------
// Each record carries an HMAC over its own content plus the previous record's
// hash, so altering, deleting or splicing a row invalidates every hash after
// it. The key is read from the environment, never stored in the database, so
// reaching the SQLite file alone is not enough to recompute a valid chain.
//
// What this does NOT cover: an attacker who also holds the key can forge the
// chain, and truncating the newest records leaves a shorter but self-consistent
// chain. Recording the head hash off-host (see verifyAuditChain().head) is what
// detects truncation.
const AUDIT_HMAC_KEY = process.env.AUDIT_HMAC_KEY || process.env.JWT_SECRET || "test-only-secret";

// Fixed field order; values are JSON-encoded so a value containing the
// separator cannot be made to look like a field boundary.
const CHAIN_FIELDS = [
  "id",
  "product_id",
  "product_name",
  "manufacturer_id",
  "is_paying_client",
  "old_score",
  "new_score",
  "score_delta",
  "changed_at",
  "changed_by",
  "change_reason",
  "methodology_version",
  "catalog_hash",
  "code_revision",
];

function chainHash(prevHash, row) {
  const canonical = CHAIN_FIELDS.map((f) => JSON.stringify(row[f] ?? null)).join("\u001f");
  return crypto
    .createHmac("sha256", AUDIT_HMAC_KEY)
    .update(`${prevHash ?? ""}\u001e${canonical}`)
    .digest("hex");
}

function chainHead(db) {
  const row = db
    .prepare(
      "SELECT entry_hash FROM score_change_logs WHERE entry_hash IS NOT NULL ORDER BY rowid DESC LIMIT 1"
    )
    .get();
  return row?.entry_hash ?? null;
}

// Re-walks the chain and reports the first inconsistency. Rows written before
// migration 009 have no hash; they are counted as `unchained`, not as tampered.
function verifyAuditChain() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT ${CHAIN_FIELDS.join(", ")}, prev_hash, entry_hash
       FROM score_change_logs ORDER BY rowid`
    )
    .all();

  let prev = null;
  let checked = 0;
  let unchained = 0;

  for (const row of rows) {
    if (row.entry_hash === null) {
      unchained++;
      continue;
    }
    if ((row.prev_hash ?? null) !== prev) {
      return {
        ok: false,
        reason: "chain broken: a record was removed or reordered",
        at: row.id,
        checked,
        unchained,
      };
    }
    if (chainHash(prev, row) !== row.entry_hash) {
      return {
        ok: false,
        reason: "record altered: content does not match its hash",
        at: row.id,
        checked,
        unchained,
      };
    }
    prev = row.entry_hash;
    checked++;
  }

  return { ok: true, checked, unchained, head: prev };
}

// changed_at is supplied here rather than left to SQLite's DEFAULT so the
// timestamp is covered by the hash.
const INSERT_LOG = `
  INSERT INTO score_change_logs
    (id, product_id, product_name, manufacturer_id, is_paying_client,
     old_score, new_score, score_delta, changed_at, changed_by, change_reason,
     methodology_version, catalog_hash, code_revision, prev_hash, entry_hash)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

  const row = {
    id: crypto.randomUUID(),
    product_id: productId,
    product_name: productName,
    manufacturer_id: mfr?.id ?? null,
    is_paying_client: mfr?.is_paying ? 1 : 0,
    old_score: oldScore,
    new_score: newScore,
    score_delta: parseFloat((newScore - oldScore).toFixed(4)),
    changed_at: new Date().toISOString().replace("T", " ").slice(0, 19),
    changed_by: changedBy,
    change_reason: changeReason || "unspecified",
    methodology_version: METHODOLOGY_VERSION,
    catalog_hash: CATALOG_HASH,
    code_revision: CODE_REVISION,
  };

  // Reading the head and appending must not interleave with another writer, or
  // two records could claim the same predecessor.
  db.transaction(() => {
    const prevHash = chainHead(db);
    db.prepare(INSERT_LOG).run(
      ...CHAIN_FIELDS.map((f) => row[f]),
      prevHash,
      chainHash(prevHash, row)
    );
    db.prepare(UPSERT_SNAPSHOT).run(productId, newScore);
  })();
}

function snapshotScores(products, scoreFn, options = {}) {
  const { changedBy = "system", changeReason = "Model retrain / algorithm update" } = options;
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
        changedBy,
        changeReason,
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

module.exports = {
  logScoreChange,
  snapshotScores,
  getConflictLog,
  getConflictStats,
  verifyAuditChain,
};
