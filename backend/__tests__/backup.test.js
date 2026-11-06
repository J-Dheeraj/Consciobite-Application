const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const BACKEND = path.join(__dirname, "..");
const SCRIPT = path.join(BACKEND, "scripts", "backup.js");

function freshDatabase() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "backup-test-"));
  const dbPath = path.join(dir, "source.db");
  const backupDir = path.join(dir, "snapshots");
  execFileSync(
    "node",
    ["-e", `require("./src/db/schema").getDb(); require("./src/db/migrate").runMigrations();`],
    {
      cwd: BACKEND,
      env: { ...process.env, NODE_ENV: "development", DB_PATH: dbPath, JWT_SECRET: "x".repeat(32) },
      stdio: "ignore",
    }
  );
  return { dir, dbPath, backupDir };
}

const runBackup = (dbPath, backupDir, extra = {}) =>
  execFileSync("node", [SCRIPT], {
    cwd: BACKEND,
    env: {
      ...process.env,
      NODE_ENV: "development",
      DB_PATH: dbPath,
      BACKUP_DIR: backupDir,
      ...extra,
    },
    stdio: ["ignore", "pipe", "pipe"],
  }).toString();

const snapshots = (dir) => fs.readdirSync(dir).filter((f) => /^consciobite-.*\.db$/.test(f));

describe("Database backup (T-8)", () => {
  let ctx;
  beforeAll(() => {
    ctx = freshDatabase();
  });
  afterAll(() => fs.rmSync(ctx.dir, { recursive: true, force: true }));

  test("writes a snapshot and verifies it against the source", () => {
    const out = runBackup(ctx.dbPath, ctx.backupDir);
    expect(out).toMatch(/written and verified/);
    expect(out).toMatch(/integrity_check ok/);
    expect(snapshots(ctx.backupDir)).toHaveLength(1);
  });

  test("the snapshot is a single self-contained file, with no -wal/-shm left behind", () => {
    // A WAL-mode database copied off-host without its sidecars can lose its
    // most recent commits, so the snapshot must not be in WAL mode.
    const files = fs.readdirSync(ctx.backupDir);
    expect(files.filter((f) => f.endsWith("-wal") || f.endsWith("-shm"))).toHaveLength(0);
  });

  test("BACKUP_KEEP prunes older snapshots", () => {
    const src = path.join(ctx.backupDir, snapshots(ctx.backupDir)[0]);
    for (let i = 1; i <= 6; i++) {
      fs.copyFileSync(src, path.join(ctx.backupDir, `consciobite-2026-01-0${i}T00-00-00-000Z.db`));
    }
    expect(snapshots(ctx.backupDir).length).toBeGreaterThan(3);

    const out = runBackup(ctx.dbPath, ctx.backupDir, { BACKUP_KEEP: "3" });
    expect(out).toMatch(/pruned \d+ snapshot/);
    expect(snapshots(ctx.backupDir)).toHaveLength(3);
  });

  test("BACKUP_KEEP=0 retains every snapshot", () => {
    const before = snapshots(ctx.backupDir).length;
    const out = runBackup(ctx.dbPath, ctx.backupDir, { BACKUP_KEEP: "0" });
    expect(out).not.toMatch(/pruned/);
    expect(snapshots(ctx.backupDir)).toHaveLength(before + 1);
  });

  test("a missing source database fails loudly", () => {
    expect(() => runBackup(path.join(ctx.dir, "nope.db"), ctx.backupDir)).toThrow();
  });
});
