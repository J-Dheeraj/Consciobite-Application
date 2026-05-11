const fs = require("fs");
const path = require("path");
const { getDb } = require("./schema");
const { logger } = require("../middleware/logger");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

function ensureMigrationsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `);
}

function getAppliedMigrations(db) {
  return db
    .prepare("SELECT name FROM _migrations ORDER BY id")
    .all()
    .map((r) => r.name);
}

function getPendingMigrations(applied) {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  return files.filter((f) => !applied.includes(f));
}

function runMigrations() {
  const db = getDb();
  ensureMigrationsTable(db);

  const applied = getAppliedMigrations(db);
  const pending = getPendingMigrations(applied);

  if (pending.length === 0) {
    logger.info("Database is up to date (no pending migrations)");
    return;
  }

  const runMigration = db.transaction((filename) => {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), "utf-8");
    db.exec(sql);
    db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(filename);
  });

  for (const file of pending) {
    logger.info(`Running migration: ${file}`);
    runMigration(file);
  }

  logger.info(`Applied ${pending.length} migration(s)`);
}

module.exports = { runMigrations };
