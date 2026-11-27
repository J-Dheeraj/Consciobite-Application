/**
 * Opens the SQLite database, either as a plain local file (better-sqlite3) or
 * as a Turso embedded replica (libsql).
 *
 * Why Turso: on Render's free plan the disk is wiped on every deploy and every
 * spin-down, so a local SQLite file silently loses every user, review,
 * favourite and audit entry. An embedded replica keeps a local copy for reads
 * and sends every write to the hosted primary, so the data outlives the
 * instance. On startup the replica pulls the primary's state before serving.
 *
 * Selection:
 *   TURSO_DATABASE_URL set  -> libsql embedded replica of that database
 *                              (TURSO_AUTH_TOKEN required)
 *   DB_DRIVER=libsql        -> libsql on the local file only (lets the test
 *                              suite exercise the libsql code path offline)
 *   otherwise               -> better-sqlite3 on the local file, as before
 *
 * libsql's API is "better-sqlite3 compatible" but not identical: rows come
 * back with an extra enumerable `_metadata` field (which would leak into API
 * responses), and `pluck()` / `pragma(..., { simple: true })` do not unwrap
 * the value. The small wrapper below restores better-sqlite3 behaviour for
 * the parts of the API this codebase uses: prepare/get/all/iterate/run,
 * pluck/raw, exec, pragma, transaction and close.
 */

const { logger } = require("../middleware/logger");

function stripMeta(row) {
  if (row === null || typeof row !== "object" || Array.isArray(row)) return row;
  if (!Object.prototype.hasOwnProperty.call(row, "_metadata")) return row;
  // eslint-disable-next-line no-unused-vars
  const { _metadata, ...rest } = row;
  return rest;
}

function stripRun(info) {
  if (!info || typeof info !== "object") return info;
  return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
}

class Statement {
  constructor(stmt) {
    this._stmt = stmt;
    this._pluck = false;
    this._raw = false;
  }

  pluck(on = true) {
    this._pluck = on;
    if (on) this._raw = false;
    return this;
  }

  raw(on = true) {
    this._raw = on;
    if (on) this._pluck = false;
    this._stmt.raw(on);
    return this;
  }

  _shape(row) {
    if (row === undefined || row === null) return row;
    if (this._raw) return row;
    const clean = stripMeta(row);
    return this._pluck ? clean[Object.keys(clean)[0]] : clean;
  }

  // libsql's own get() can leave the statement mid-step, and an unfinished
  // statement makes the enclosing transaction fail to commit ("cannot commit
  // transaction - SQL statements in progress"). Running it to completion and
  // taking the first row avoids that; every get() here is a keyed or LIMIT 1
  // lookup, so the extra rows are not a cost in practice.
  get(...args) {
    return this._shape(this._stmt.all(...args)[0]);
  }

  all(...args) {
    return this._stmt.all(...args).map((r) => this._shape(r));
  }

  *iterate(...args) {
    for (const r of this._stmt.iterate(...args)) yield this._shape(r);
  }

  run(...args) {
    return stripRun(this._stmt.run(...args));
  }

  columns() {
    return this._stmt.columns();
  }
}

class LibsqlDatabase {
  constructor(inner, { replica }) {
    this._db = inner;
    this.replica = replica;
    this.driver = "libsql";
  }

  prepare(sql) {
    return new Statement(this._db.prepare(sql));
  }

  exec(sql) {
    this._db.exec(sql);
    return this;
  }

  pragma(source, options = {}) {
    // An embedded replica owns its own journal; changing it is not supported.
    if (this.replica && /^\s*journal_mode\s*=/i.test(source)) return undefined;
    const stmt = this.prepare(`PRAGMA ${source}`);
    return options.simple ? stmt.pluck().get() : stmt.all();
  }

  transaction(fn) {
    return this._db.transaction(fn);
  }

  sync() {
    return this.replica ? this._db.sync() : undefined;
  }

  close() {
    this._db.close();
  }
}

function openDatabase(localPath) {
  const url = process.env.TURSO_DATABASE_URL;

  if (url) {
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!authToken) {
      throw new Error("TURSO_DATABASE_URL is set but TURSO_AUTH_TOKEN is missing");
    }
    const Libsql = require("libsql");
    const db = new LibsqlDatabase(
      new Libsql(localPath, {
        syncUrl: url,
        authToken,
        // Pull other writers' changes every minute. Our own writes go to the
        // primary and are readable immediately (read-your-writes).
        syncPeriod: 60,
      }),
      { replica: true }
    );
    db.pragma("busy_timeout = 5000");
    // Block startup until the local copy matches the primary, so the first
    // request after a cold start never sees an empty database.
    db.sync();
    logger.info("Database: Turso embedded replica, synced from primary");
    return db;
  }

  if (process.env.DB_DRIVER === "libsql") {
    const Libsql = require("libsql");
    const db = new LibsqlDatabase(new Libsql(localPath), { replica: false });
    // better-sqlite3 waits up to 5 s for a lock by default; libsql does not.
    db.pragma("busy_timeout = 5000");
    return db;
  }

  const BetterSqlite = require("better-sqlite3");
  const db = new BetterSqlite(localPath);
  db.driver = "better-sqlite3";
  return db;
}

module.exports = { openDatabase };
