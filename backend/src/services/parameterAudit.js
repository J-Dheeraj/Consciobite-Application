const crypto = require("crypto");
const { getDb } = require("../db/schema");
const { logger } = require("../middleware/logger");

const INSERT_LOG = `
  INSERT INTO model_parameter_logs (id, parameters_json, parameters_hash, change_reason)
  VALUES (?, ?, ?, ?)
`;

const GET_LATEST = `
  SELECT parameters_hash FROM model_parameter_logs ORDER BY changed_at DESC LIMIT 1
`;

function hashParameters(parameters) {
  return crypto.createHash("sha256").update(JSON.stringify(parameters)).digest("hex");
}

function checkAndLogParameterChange(parameters) {
  const db = getDb();
  const hash = hashParameters(parameters);
  const latest = db.prepare(GET_LATEST).get();

  if (latest && latest.parameters_hash === hash) return null;

  const reason = latest
    ? "Scoring parameter change detected on startup"
    : "Initial parameter snapshot";

  db.prepare(INSERT_LOG).run(crypto.randomUUID(), JSON.stringify(parameters), hash, reason);

  if (latest) {
    logger.warn("Parameter audit: GreenGrade scoring parameters changed since last startup");
  }

  return { hash, reason };
}

function getParameterLog({ limit = 50, offset = 0 } = {}) {
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM model_parameter_logs ORDER BY changed_at DESC LIMIT ? OFFSET ?`)
    .all(limit, offset);

  return rows.map((row) => ({ ...row, parameters_json: JSON.parse(row.parameters_json) }));
}

module.exports = { checkAndLogParameterChange, getParameterLog };
