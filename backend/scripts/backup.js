/**
 * SQLite online backup: snapshots the live database using better-sqlite3's
 * backup API (safe while the server is running), then verifies the snapshot is
 * actually restorable before reporting success.
 *
 * Usage: npm run backup
 *
 * Env:
 *   DB_PATH      source database (default backend/data/consciobite.db)
 *   BACKUP_DIR   destination (default backend/backups) -- point this at a
 *                mounted volume or persistent disk for durability; the default
 *                lives on the same ephemeral disk as the database, so it
 *                protects against operator error only, not host loss (T-8)
 *   BACKUP_KEEP  how many snapshots to retain (default 7, 0 = keep all)
 */

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "consciobite.db");
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, "..", "backups");
// Exactly the files this script writes -- not stray -wal/-shm sidecars.
const SNAPSHOT_NAME = /^consciobite-.*\.db$/;
const KEEP = process.env.BACKUP_KEEP === undefined ? 7 : parseInt(process.env.BACKUP_KEEP, 10);

const userTables = (db) =>
  db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all()
    .map((r) => r.name);

const rowCounts = (db) =>
  Object.fromEntries(
    userTables(db).map((t) => [t, db.prepare(`SELECT COUNT(*) AS c FROM "${t}"`).get().c])
  );

// A snapshot nobody has opened is not a backup. Confirm the file parses, passes
// SQLite's own integrity check, and holds the same rows as the source.
//
// Opened read-write on purpose: switching the copy out of WAL mode folds the
// -wal contents into the single .db file and removes the -wal/-shm sidecars, so
// the snapshot is self-contained. A WAL-mode database copied off-host without
// its sidecars can silently lose its most recent commits.
function verify(target, expected) {
  const copy = new Database(target);
  try {
    copy.pragma("journal_mode = DELETE");
    const integrity = copy.pragma("integrity_check", { simple: true });
    if (integrity !== "ok") return `integrity_check returned "${integrity}"`;

    const actual = rowCounts(copy);
    for (const [table, count] of Object.entries(expected)) {
      if (actual[table] === undefined) return `table ${table} missing from the snapshot`;
      if (actual[table] !== count) {
        return `table ${table}: source has ${count} row(s), snapshot has ${actual[table]}`;
      }
    }
    return null;
  } finally {
    copy.close();
  }
}

function prune() {
  if (!Number.isInteger(KEEP) || KEEP <= 0) return [];
  const snapshots = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => SNAPSHOT_NAME.test(f))
    .sort()
    .reverse();
  const stale = snapshots.slice(KEEP);
  for (const f of stale) fs.unlinkSync(path.join(BACKUP_DIR, f));
  return stale;
}

async function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`No database found at ${DB_PATH}`);
    process.exit(1);
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const target = path.join(BACKUP_DIR, `consciobite-${stamp}.db`);

  const db = new Database(DB_PATH, { readonly: true });
  const expected = rowCounts(db);
  await db.backup(target);
  db.close();

  const problem = verify(target, expected);
  if (problem) {
    // Removed rather than kept: an unusable file in the backup directory is
    // worse than no file, because it reads as a backup.
    fs.unlinkSync(target);
    console.error(`Backup verification FAILED and the snapshot was discarded: ${problem}`);
    process.exit(1);
  }

  const { size } = fs.statSync(target);
  const tables = Object.keys(expected).length;
  const rows = Object.values(expected).reduce((a, b) => a + b, 0);
  console.log(`Backup written and verified: ${target} (${(size / 1024).toFixed(1)} KB)`);
  console.log(`  integrity_check ok, ${rows} row(s) across ${tables} table(s) match the source`);

  const pruned = prune();
  if (pruned.length) console.log(`  pruned ${pruned.length} snapshot(s) beyond the newest ${KEEP}`);

  if (!process.env.BACKUP_DIR) {
    console.log("  NOTE: BACKUP_DIR is unset, so this snapshot sits on the same disk as the");
    console.log("  database. Set BACKUP_DIR to a durable location, or copy it off-host.");
  }
}

main().catch((err) => {
  console.error(`Backup failed: ${err.message}`);
  process.exit(1);
});
