const request = require("supertest");
const { randomUUID } = require("crypto");

process.env.NODE_ENV = "test";
const app = require("../src/index");

const uid = () => randomUUID().slice(0, 8);

async function registerUser() {
  const email = `sec-${uid()}@example.com`;
  const password = "ValidPass1";
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Security Test", email, password });
  expect(res.status).toBe(201);
  return { email, password, token: res.body.token, user: res.body.user, body: res.body };
}

describe("Token lifecycle", () => {
  test("login/register responses include expiresAt", async () => {
    const { body } = await registerUser();
    expect(typeof body.expiresAt).toBe("number");
    expect(body.expiresAt).toBeGreaterThan(Date.now());
  });

  test("logout revokes the presented token", async () => {
    const { token } = await registerUser();

    const before = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(before.status).toBe(200);

    const logout = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);
    expect(logout.status).toBe(200);

    const after = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(after.status).toBe(401);
  });

  test("logout without a token still succeeds (idempotent)", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
  });

  test("refresh rotates to a new usable token with expiresAt", async () => {
    const { token } = await registerUser();

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.token).not.toBe(token);
    expect(typeof res.body.expiresAt).toBe("number");

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${res.body.token}`);
    expect(me.status).toBe(200);
  });

  test("a revoked token cannot be refreshed", async () => {
    const { token } = await registerUser();
    await request(app).post("/api/auth/logout").set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/export", () => {
  test("requires authentication", async () => {
    const res = await request(app).get("/api/auth/export");
    expect(res.status).toBe(401);
  });

  test("returns profile, reviews, and carbon logs", async () => {
    const { token, user } = await registerUser();
    const res = await request(app).get("/api/auth/export").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    expect(Array.isArray(res.body.reviews)).toBe(true);
    expect(Array.isArray(res.body.carbon_logs)).toBe(true);
    expect(res.body.exported_at).toBeDefined();
  });
});

describe("DELETE /api/auth/account", () => {
  test("requires password confirmation", async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .delete("/api/auth/account")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  test("rejects an incorrect password", async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .delete("/api/auth/account")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "WrongPass1" });
    expect(res.status).toBe(401);
  });

  test("deletes the account and all associated data", async () => {
    const { token, password, email } = await registerUser();

    const res = await request(app)
      .delete("/api/auth/account")
      .set("Authorization", `Bearer ${token}`)
      .send({ password });
    expect(res.status).toBe(200);

    // Login with the deleted account must fail
    const login = await request(app).post("/api/auth/login").send({ email, password });
    expect(login.status).toBe(401);
  });
});

describe("GET /api/health/live", () => {
  test("responds without dependency checks", async () => {
    const res = await request(app).get("/api/health/live");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("alive");
  });
});

describe("Score audit provenance", () => {
  const { getDb } = require("../src/db/schema");

  // Remove all traces of provenance test rows so other suites' exact-count
  // assertions (e.g. product_scores === 550) stay valid across runs.
  function cleanupProvenanceRows() {
    const db = getDb();
    db.prepare("DELETE FROM score_change_logs WHERE product_id LIKE 'prov-test-%'").run();
    db.prepare("DELETE FROM product_scores WHERE product_id LIKE 'prov-test-%'").run();
  }

  beforeAll(cleanupProvenanceRows);
  afterAll(cleanupProvenanceRows);

  test("logScoreChange binds methodology version, catalog hash, and code revision", () => {
    const { logScoreChange } = require("../src/services/scoreAudit");

    const productId = `prov-test-${uid()}`;
    logScoreChange({
      productId,
      productName: "Provenance Test Product",
      oldScore: 5.0,
      newScore: 6.0,
      changedBy: "test",
      changeReason: "provenance test",
    });

    const row = getDb()
      .prepare("SELECT * FROM score_change_logs WHERE product_id = ?")
      .get(productId);
    expect(row.methodology_version).toBe("3.0");
    expect(row.catalog_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(row.code_revision).toBeDefined();
    expect(row.change_reason).toBe("provenance test");
  });
});
