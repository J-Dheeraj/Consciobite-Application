const request = require("supertest");
const { randomUUID } = require("crypto");

process.env.NODE_ENV = "test";
const app = require("../src/index");
const { getDb } = require("../src/db/schema");

// Unique, pattern-valid version numbers so repeat test runs against the
// persisted SQLite file never collide on the UNIQUE(version) constraint.
function uniqueVersion() {
  return `9.${Date.now() % 1000000}.${Math.floor(Math.random() * 1000)}`;
}

describe("Methodology changelog", () => {
  let adminToken;
  let userToken;
  const adminEmail = `admin-${randomUUID().slice(0, 8)}@example.com`;
  const userEmail = `user-${randomUUID().slice(0, 8)}@example.com`;

  beforeAll(async () => {
    const adminRes = await request(app).post("/api/auth/register").send({
      name: "Admin User",
      email: adminEmail,
      password: "AdminPass1",
    });
    adminToken = adminRes.body.token;

    const db = getDb();
    db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(adminEmail);

    const userRes = await request(app).post("/api/auth/register").send({
      name: "Regular User",
      email: userEmail,
      password: "UserPass1",
    });
    userToken = userRes.body.token;
  });

  describe("GET /api/methodology/changelog", () => {
    test("is public and includes the seeded v3.0 baseline", async () => {
      const res = await request(app).get("/api/methodology/changelog");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("entries");
      expect(res.body).toHaveProperty("totalEntries");
      expect(res.body.totalEntries).toBeGreaterThanOrEqual(1);
      expect(res.body.entries.some((e) => e.version === "3.0")).toBe(true);
    });

    test("rejects a non-numeric limit", async () => {
      const res = await request(app).get("/api/methodology/changelog?limit=abc");
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/methodology", () => {
    test("version field matches the most recent changelog entry", async () => {
      const changelog = await request(app).get("/api/methodology/changelog?limit=1");
      const methodology = await request(app).get("/api/methodology");
      expect(methodology.body.version).toBe(changelog.body.entries[0].version);
    });
  });

  describe("POST /api/admin/methodology-version", () => {
    test("rejects unauthenticated requests", async () => {
      const res = await request(app)
        .post("/api/admin/methodology-version")
        .send({ version: uniqueVersion(), summary: "Test bump" });
      expect(res.status).toBe(401);
    });

    test("rejects non-admin users", async () => {
      const res = await request(app)
        .post("/api/admin/methodology-version")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ version: uniqueVersion(), summary: "Test bump" });
      expect(res.status).toBe(403);
    });

    test("rejects a malformed version string", async () => {
      const res = await request(app)
        .post("/api/admin/methodology-version")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ version: "not-a-version", summary: "Test bump" });
      expect(res.status).toBe(400);
    });

    test("rejects a missing summary", async () => {
      const res = await request(app)
        .post("/api/admin/methodology-version")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ version: uniqueVersion() });
      expect(res.status).toBe(400);
    });

    test("admin can record a new version, and it becomes current", async () => {
      const version = uniqueVersion();
      const res = await request(app)
        .post("/api/admin/methodology-version")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          version,
          summary: "Adjusted sigmoid midpoint after retrain",
          changedParams: { sigmoid: { k: 5, midpoint: 0.45 } },
        });
      expect(res.status).toBe(201);
      expect(res.body.version).toBe(version);
      expect(res.body.changed_params).toEqual({ sigmoid: { k: 5, midpoint: 0.45 } });

      const methodology = await request(app).get("/api/methodology");
      expect(methodology.body.version).toBe(version);

      const passport = await request(app).get("/api/v1/passport/1");
      expect(passport.body.methodology_version).toBe(version);
    });

    test("rejects a duplicate version", async () => {
      const version = uniqueVersion();
      await request(app)
        .post("/api/admin/methodology-version")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ version, summary: "First" });

      const res = await request(app)
        .post("/api/admin/methodology-version")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ version, summary: "Duplicate" });
      expect(res.status).toBe(409);
    });

    test("rejects a non-object changedParams", async () => {
      const res = await request(app)
        .post("/api/admin/methodology-version")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ version: uniqueVersion(), summary: "Bad params", changedParams: "not-an-object" });
      expect(res.status).toBe(400);
    });
  });
});
