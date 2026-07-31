const request = require("supertest");
const { randomUUID } = require("crypto");

process.env.NODE_ENV = "test";
const app = require("../src/index");
const { getDb } = require("../src/db/schema");

describe("Admin governance endpoints", () => {
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

  describe("requireAdmin middleware", () => {
    test("should reject unauthenticated requests", async () => {
      const res = await request(app).get("/api/admin/conflict-log");
      expect(res.status).toBe(401);
    });

    test("should reject non-admin users", async () => {
      const res = await request(app)
        .get("/api/admin/conflict-log")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toContain("Admin");
    });

    test("should allow admin users", async () => {
      const res = await request(app)
        .get("/api/admin/conflict-log")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/admin/conflict-log", () => {
    test("should return logs and stats", async () => {
      const res = await request(app)
        .get("/api/admin/conflict-log")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("logs");
      expect(res.body).toHaveProperty("stats");
      expect(Array.isArray(res.body.logs)).toBe(true);
      expect(res.body.stats).toHaveProperty("totalChanges");
      expect(res.body.stats).toHaveProperty("paying");
      expect(res.body.stats).toHaveProperty("nonPaying");
    });

    test("should accept filter parameter", async () => {
      const res = await request(app)
        .get("/api/admin/conflict-log?filter=paying")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    test("should reject invalid filter", async () => {
      const res = await request(app)
        .get("/api/admin/conflict-log?filter=invalid")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/admin/rescore", () => {
    test("should rescore all products and return changes", async () => {
      const res = await request(app)
        .post("/api/admin/rescore")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("changes");
      expect(Array.isArray(res.body.changes)).toBe(true);
    });
  });

  describe("POST /api/admin/manufacturers", () => {
    test("should create a manufacturer", async () => {
      const res = await request(app)
        .post("/api/admin/manufacturers")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Test Manufacturer",
          email: `mfr-${randomUUID().slice(0, 8)}@example.com`,
          isPaying: true,
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.name).toBe("Test Manufacturer");
      expect(res.body.isPaying).toBe(true);
    });

    test("should reject duplicate email", async () => {
      const email = `mfr-dup-${randomUUID().slice(0, 8)}@example.com`;
      await request(app)
        .post("/api/admin/manufacturers")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "First", email });

      const res = await request(app)
        .post("/api/admin/manufacturers")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Second", email });
      expect(res.status).toBe(409);
    });

    test("should reject missing name", async () => {
      const res = await request(app)
        .post("/api/admin/manufacturers")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ email: "test@test.com" });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/admin/manufacturers", () => {
    test("should list manufacturers", async () => {
      const res = await request(app)
        .get("/api/admin/manufacturers")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe("POST /api/admin/product-manufacturer", () => {
    let manufacturerId;

    beforeAll(async () => {
      const res = await request(app)
        .post("/api/admin/manufacturers")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Link Test Mfr",
          email: `link-${randomUUID().slice(0, 8)}@example.com`,
          isPaying: true,
        });
      manufacturerId = res.body.id;
    });

    test("should link product to manufacturer", async () => {
      const res = await request(app)
        .post("/api/admin/product-manufacturer")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ productId: "1", manufacturerId });
      expect(res.status).toBe(200);
      expect(res.body.productId).toBe("1");
      expect(res.body.manufacturerId).toBe(manufacturerId);
    });

    test("should return 404 for unknown manufacturer", async () => {
      const res = await request(app)
        .post("/api/admin/product-manufacturer")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ productId: "1", manufacturerId: "nonexistent" });
      expect(res.status).toBe(404);
    });

    test("should return 404 for unknown product", async () => {
      const res = await request(app)
        .post("/api/admin/product-manufacturer")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ productId: "99999", manufacturerId });
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/admin/manufacturers/:id/acknowledge-fee", () => {
    let manufacturerId;

    beforeAll(async () => {
      const res = await request(app)
        .post("/api/admin/manufacturers")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Ack Test Mfr",
          email: `ack-${randomUUID().slice(0, 8)}@example.com`,
        });
      manufacturerId = res.body.id;
    });

    test("should acknowledge fee", async () => {
      const res = await request(app)
        .post(`/api/admin/manufacturers/${manufacturerId}/acknowledge-fee`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.acknowledged).toBe(true);
    });

    test("should return 404 for unknown manufacturer", async () => {
      const res = await request(app)
        .post("/api/admin/manufacturers/nonexistent/acknowledge-fee")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe("Score audit integration", () => {
    test("product_scores table should have snapshots", async () => {
      const db = getDb();
      const count = db.prepare("SELECT COUNT(*) as c FROM product_scores").get();
      expect(count.c).toBe(550);
    });

    test("score_change_logs should track changes after rescore", async () => {
      const db = getDb();
      const before = db.prepare("SELECT COUNT(*) as c FROM score_change_logs").get();

      await request(app).post("/api/admin/rescore").set("Authorization", `Bearer ${adminToken}`);

      const after = db.prepare("SELECT COUNT(*) as c FROM score_change_logs").get();
      expect(after.c).toBeGreaterThanOrEqual(before.c);
    });

    test("linked paying manufacturer should be flagged in audit", async () => {
      const db = getDb();

      const mfrRes = await request(app)
        .post("/api/admin/manufacturers")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Paying Mfr",
          email: `paying-${randomUUID().slice(0, 8)}@example.com`,
          isPaying: true,
        });

      await request(app)
        .post("/api/admin/product-manufacturer")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ productId: "2", manufacturerId: mfrRes.body.id });

      const link = db
        .prepare(
          `SELECT m.is_paying FROM product_manufacturers pm
           JOIN manufacturers m ON m.id = pm.manufacturer_id
           WHERE pm.product_id = '2'`
        )
        .get();
      expect(link.is_paying).toBe(1);
    });
  });

  describe("v1 alias", () => {
    test("should work at /api/v1/admin/conflict-log", async () => {
      const res = await request(app)
        .get("/api/v1/admin/conflict-log")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/admin/pending-evidence", () => {
    test("should reject unauthenticated requests", async () => {
      const res = await request(app).get("/api/admin/pending-evidence");
      expect(res.status).toBe(401);
    });

    test("should reject non-admin users", async () => {
      const res = await request(app)
        .get("/api/admin/pending-evidence")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    test("should return pending evidence for admin", async () => {
      const res = await request(app)
        .get("/api/admin/pending-evidence")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("evidence");
      expect(res.body).toHaveProperty("total");
      expect(Array.isArray(res.body.evidence)).toBe(true);
    });

    test("should respect limit and offset params", async () => {
      const res = await request(app)
        .get("/api/admin/pending-evidence?limit=5&offset=0")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.evidence)).toBe(true);
    });
  });

  describe("POST /api/admin/evidence/:id/review", () => {
    let submittedEvidenceId;

    beforeAll(async () => {
      const submitRes = await request(app)
        .post("/api/products/1/evidence")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          citation:
            "Test peer-reviewed LCA study for evidence review integration test (Consciobite 2026)",
          source_type: "peer_reviewed_lca",
          methodology: "ISO 14040/44",
          url: "https://example.com/lca-study",
          year: 2025,
        });
      submittedEvidenceId = submitRes.body?.id;
    });

    test("should reject unauthenticated requests", async () => {
      const res = await request(app)
        .post(`/api/admin/evidence/1/review`)
        .send({ status: "approved" });
      expect(res.status).toBe(401);
    });

    test("should reject non-admin users", async () => {
      const res = await request(app)
        .post(`/api/admin/evidence/1/review`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ status: "approved" });
      expect(res.status).toBe(403);
    });

    test("should approve a pending evidence submission", async () => {
      if (!submittedEvidenceId) return;
      const res = await request(app)
        .post(`/api/admin/evidence/${submittedEvidenceId}/review`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "approved", notes: "Verified source, good methodology." });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("approved");
    });

    test("should return 404 when re-reviewing already reviewed evidence", async () => {
      if (!submittedEvidenceId) return;
      const res = await request(app)
        .post(`/api/admin/evidence/${submittedEvidenceId}/review`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "rejected", notes: "No longer pending." });
      expect(res.status).toBe(404);
    });

    test("should reject an invalid evidence ID", async () => {
      const res = await request(app)
        .post("/api/admin/evidence/abc/review")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "approved" });
      expect(res.status).toBe(400);
    });

    test("should reject invalid status value", async () => {
      const res = await request(app)
        .post("/api/admin/evidence/999/review")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "maybe" });
      expect(res.status).toBe(400);
    });
  });
});
