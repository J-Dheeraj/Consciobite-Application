/**
 * SQLite online backup: snapshots the live database to backend/backups/
 * using better-sqlite3's backup API (safe while the server is running).
 *
 * Usage: npm run backup
 */

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "consciobite.db");
const BACKUP_DIR = path.join(__dirname, "..", "backups");

async function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`No database found at ${DB_PATH}`);
    process.exit(1);
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const target = path.join(BACKUP_DIR, `consciobite-${stamp}.db`);

  const db = new Database(DB_PATH, { readonly: true });
  await db.backup(target);
  db.close();

  const { size } = fs.statSync(target);
  console.log(`Backup written: ${target} (${(size / 1024).toFixed(1)} KB)`);
  console.log("Copy this file off-host for real durability.");
}

main().catch((err) => {
  console.error(`Backup failed: ${err.message}`);
  process.exit(1);
});
