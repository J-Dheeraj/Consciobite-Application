const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

process.env.NODE_ENV = "test";
require("../src/index");
const { getDb } = require("../src/db/schema");
const { verifyAuditChain } = require("../src/services/scoreAudit");

const BACKEND = path.join(__dirname, "..");

// These tests never call logScoreChange against the shared test database:
// it also upserts product_scores, which admin.test.js asserts holds exactly the
// 550 catalog products. Suites run concurrently, so cleaning up afterwards
// would race that assertion. Chain behaviour is exercised on isolated
// databases instead (see tamperScenario).

// Tampering has to happen on a database of its own: these scenarios drop the
// append-only triggers and rewrite rows, which would corrupt the shared test DB
// for every other suite.
function tamperScenario(mutation, { verifyKey = "chain-test-key" } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "audit-chain-"));
  const dbPath = path.join(dir, "t.db");
  const env = {
    ...process.env,
    NODE_ENV: "development",
    DB_PATH: dbPath,
    JWT_SECRET: "x".repeat(32),
    AUDIT_HMAC_KEY: "chain-test-key",
  };

  const seed = `
    require("./src/db/schema").getDb();
    require("./src/db/migrate").runMigrations();
    const { logScoreChange } = require("./src/services/scoreAudit");
    const db = require("./src/db/schema").getDb();
    for (let i = 1; i <= 4; i++) {
      logScoreChange({ productId: String(i), productName: "P" + i, oldScore: 5, newScore: 5 + i,
        changedBy: "test", changeReason: "r" + i });
    }
    // what an attacker with host access does first
    db.exec("DROP TRIGGER IF EXISTS score_change_logs_no_update; DROP TRIGGER IF EXISTS score_change_logs_no_delete;");
    ${mutation}
  `;
  execFileSync("node", ["-e", seed], { cwd: BACKEND, env, stdio: "ignore" });

  const check = `console.log(JSON.stringify(require("./src/services/scoreAudit").verifyAuditChain()));`;
  const out = execFileSync("node", ["-e", check], {
    cwd: BACKEND,
    env: { ...env, AUDIT_HMAC_KEY: verifyKey },
    stdio: ["ignore", "pipe", "ignore"],
  }).toString();

  fs.rmSync(dir, { recursive: true, force: true });
  return JSON.parse(out.trim().split("\n").pop());
}

describe("Audit trail is append-only at the storage layer (T-6)", () => {
  // Row triggers need a row to fire on. Inserted directly rather than through
  // logScoreChange so nothing is written to product_scores.
  beforeAll(() => {
    getDb()
      .prepare(
        `INSERT INTO score_change_logs
           (id, product_id, product_name, old_score, new_score, score_delta)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(`trig-${Date.now()}`, "trig-product", "Trigger Target", 5, 6, 1);
  });

  test("UPDATE on score_change_logs is rejected", () => {
    expect(() => getDb().prepare("UPDATE score_change_logs SET new_score = 0").run()).toThrow(
      /append-only/
    );
  });

  test("DELETE on score_change_logs is rejected", () => {
    expect(() => getDb().prepare("DELETE FROM score_change_logs").run()).toThrow(/append-only/);
  });
});

describe("Records predating the chain are reported, not flagged as tampered", () => {
  test("rows without a hash count as unchained and still verify", () => {
    // Rows written before migration 009 have no hash. Verification must treat
    // them as unchained rather than as evidence of tampering.
    const result = verifyAuditChain();
    expect(result.ok).toBe(true);
    expect(result.unchained).toBeGreaterThan(0);
  });
});

describe("Tampering is detectable even once the triggers are gone (T-6)", () => {
  test("an untouched chain verifies and reports a 64-hex head", () => {
    const r = tamperScenario("");
    expect(r.ok).toBe(true);
    expect(r.checked).toBe(4);
    expect(r.head).toMatch(/^[0-9a-f]{64}$/);
  });

  test("editing a score is detected", () => {
    const r = tamperScenario(
      `db.prepare("UPDATE score_change_logs SET new_score = 99 WHERE product_id = '2'").run();`
    );
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/altered/);
  });

  test("rewriting changed_by is detected", () => {
    const r = tamperScenario(
      `db.prepare("UPDATE score_change_logs SET changed_by = 'someone-else' WHERE product_id = '3'").run();`
    );
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/altered/);
  });

  test("deleting a middle record is detected", () => {
    const r = tamperScenario(
      `db.prepare("DELETE FROM score_change_logs WHERE product_id = '2'").run();`
    );
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/removed or reordered/);
  });

  test("a forged record cannot be appended without the key", () => {
    const r = tamperScenario(
      `db.prepare("INSERT INTO score_change_logs (id,product_id,product_name,old_score,new_score,score_delta,prev_hash,entry_hash) VALUES ('f','9','Fake',1,10,9,'deadbeef','cafebabe')").run();`
    );
    expect(r.ok).toBe(false);
  });

  test("verification fails without the right key", () => {
    expect(tamperScenario("", { verifyKey: "an-attackers-key" }).ok).toBe(false);
  });

  // Documented limitation, not an oversight: a truncated chain is still
  // self-consistent. Detecting it needs the head hash recorded off-host, which
  // is why GET /api/admin/audit-integrity exposes it.
  test("truncating the newest records is NOT detected by the chain alone", () => {
    const full = tamperScenario("");
    const cut = tamperScenario(
      `db.prepare("DELETE FROM score_change_logs WHERE product_id IN ('3','4')").run();`
    );
    expect(cut.ok).toBe(true);
    expect(cut.checked).toBeLessThan(full.checked);
    expect(cut.head).not.toBe(full.head);
  });
});
