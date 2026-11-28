/**
 * The libsql wrapper must behave like better-sqlite3 for everything the app
 * uses, or Turso-backed production would differ from what the rest of the
 * suite tests. These run against both drivers on a throwaway file.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

process.env.NODE_ENV = "test";

const { openDatabase } = require("../src/db/driver");

describe.each(["better-sqlite3", "libsql"])("openDatabase (%s)", (driver) => {
  let db;
  let dir;

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "driver-"));
    const prev = process.env.DB_DRIVER;
    if (driver === "libsql") process.env.DB_DRIVER = "libsql";
    else delete process.env.DB_DRIVER;
    db = openDatabase(path.join(dir, "t.db"));
    if (prev === undefined) delete process.env.DB_DRIVER;
    else process.env.DB_DRIVER = prev;
    db.exec("CREATE TABLE t (id INTEGER PRIMARY KEY, name TEXT)");
  });

  afterAll(() => {
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test("uses the requested driver", () => {
    expect(db.driver).toBe(driver);
  });

  test("reports local storage when Turso is not configured", () => {
    expect(db.storage).toBe("local");
  });

  test("run() returns only changes and lastInsertRowid", () => {
    const info = db.prepare("INSERT INTO t (name) VALUES (?)").run("a");
    expect(Object.keys(info).sort()).toEqual(["changes", "lastInsertRowid"]);
    expect(info.changes).toBe(1);
    expect(Number(info.lastInsertRowid)).toBe(1);
  });

  test("rows carry no extra fields, so nothing leaks into API responses", () => {
    expect(db.prepare("SELECT id, name FROM t WHERE id = 1").get()).toEqual({ id: 1, name: "a" });
    expect(JSON.stringify(db.prepare("SELECT id, name FROM t").all())).toBe(
      '[{"id":1,"name":"a"}]'
    );
  });

  test("get() returns undefined when nothing matches", () => {
    expect(db.prepare("SELECT * FROM t WHERE id = 999").get()).toBeUndefined();
  });

  test("pluck() returns the first column", () => {
    expect(db.prepare("SELECT name FROM t WHERE id = 1").pluck().get()).toBe("a");
  });

  test("pragma with simple: true returns the bare value", () => {
    db.pragma("foreign_keys = ON");
    expect(db.pragma("foreign_keys", { simple: true })).toBe(1);
  });

  test("a transaction that reads then writes commits", () => {
    const tx = db.transaction(() => {
      const last = db.prepare("SELECT name FROM t ORDER BY id DESC LIMIT 1").get();
      db.prepare("INSERT INTO t (name) VALUES (?)").run(`${last.name}+`);
    });
    tx();
    expect(db.prepare("SELECT COUNT(*) AS c FROM t").get().c).toBe(2);
  });

  test("a throwing transaction rolls back", () => {
    const tx = db.transaction(() => {
      db.prepare("INSERT INTO t (name) VALUES (?)").run("never");
      throw new Error("boom");
    });
    expect(() => tx()).toThrow("boom");
    expect(db.prepare("SELECT COUNT(*) AS c FROM t WHERE name = 'never'").get().c).toBe(0);
  });
});

describe("openDatabase with Turso configured", () => {
  test("treats a blank TURSO_DATABASE_URL as unset", () => {
    process.env.TURSO_DATABASE_URL = "   ";
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "driver-blank-"));
    try {
      const db = openDatabase(path.join(dir, "t.db"));
      expect(db.storage).toBe("local");
      db.close();
    } finally {
      delete process.env.TURSO_DATABASE_URL;
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test("refuses to start without an auth token", () => {
    process.env.TURSO_DATABASE_URL = "libsql://example.turso.io";
    delete process.env.TURSO_AUTH_TOKEN;
    try {
      expect(() => openDatabase(path.join(os.tmpdir(), "never.db"))).toThrow(/TURSO_AUTH_TOKEN/);
    } finally {
      delete process.env.TURSO_DATABASE_URL;
    }
  });
});
