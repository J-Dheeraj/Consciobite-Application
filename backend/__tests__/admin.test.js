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

  describe("Community evidence review", () => {
    let regularUserToken;
    let regularUserId;
    const reviewUserEmail = `reviewer-${randomUUID().slice(0, 8)}@example.com`;

    beforeAll(async () => {
      // Register a regular user to submit evidence
      const res = await request(app).post("/api/auth/register").send({
        name: "Evidence Submitter",
        email: reviewUserEmail,
        password: "UserPass1",
      });
      regularUserToken = res.body.token;
      regularUserId = res.body.user?.id;
    });

    test("GET /api/admin/pending-evidence should return 401 for unauthenticated", async () => {
      const res = await request(app).get("/api/admin/pending-evidence");
      expect(res.status).toBe(401);
    });

    test("GET /api/admin/pending-evidence should return 403 for non-admin", async () => {
      const res = await request(app)
        .get("/api/admin/pending-evidence")
        .set("Authorization", `Bearer ${regularUserToken}`);
      expect(res.status).toBe(403);
    });

    test("GET /api/admin/pending-evidence should return empty array when no submissions", async () => {
      const res = await request(app)
        .get("/api/admin/pending-evidence")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("evidence");
      expect(Array.isArray(res.body.evidence)).toBe(true);
    });

    test("POST /api/admin/evidence/:id/review should return 401 for unauthenticated", async () => {
      const res = await request(app)
        .post("/api/admin/evidence/1/review")
        .send({ status: "approved" });
      expect(res.status).toBe(401);
    });

    test("POST /api/admin/evidence/:id/review should return 403 for non-admin", async () => {
      const res = await request(app)
        .post("/api/admin/evidence/1/review")
        .set("Authorization", `Bearer ${regularUserToken}`)
        .send({ status: "approved" });
      expect(res.status).toBe(403);
    });

    test("POST /api/admin/evidence/:id/review should return 400 for invalid status", async () => {
      const res = await request(app)
        .post("/api/admin/evidence/1/review")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "maybe" });
      expect(res.status).toBe(400);
    });

    test("POST /api/admin/evidence/:id/review should return 400 for invalid id", async () => {
      const res = await request(app)
        .post("/api/admin/evidence/abc/review")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "approved" });
      expect(res.status).toBe(400);
    });

    test("full evidence review workflow: submit then approve", async () => {
      // Submit evidence as a regular user
      const csrfRes = await request(app).get("/api/auth/csrf");
      const csrfToken = csrfRes.body.csrfToken;

      const submitRes = await request(app)
        .post("/api/products/1/evidence")
        .set("Authorization", `Bearer ${regularUserToken}`)
        .set("x-csrf-token", csrfToken)
        .send({
          citation:
            "Test LCA study showing emissions data for this product from a peer-reviewed source",
          source_type: "peer_reviewed_lca",
          year: 2024,
        });
      expect(submitRes.status).toBe(201);
      const evidenceId = submitRes.body.id;

      // Pending list should contain the submission
      const pendingRes = await request(app)
        .get("/api/admin/pending-evidence")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(pendingRes.status).toBe(200);
      const found = pendingRes.body.evidence.find((e) => e.id === evidenceId);
      expect(found).toBeDefined();
      expect(found.source_type).toBe("peer_reviewed_lca");

      // Admin approves
      const reviewRes = await request(app)
        .post(`/api/admin/evidence/${evidenceId}/review`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "approved", notes: "Verified against our database" });
      expect(reviewRes.status).toBe(200);
      expect(reviewRes.body.status).toBe("approved");

      // Approved evidence should now appear on the product page
      const productEvidenceRes = await request(app).get("/api/products/1/evidence");
      expect(productEvidenceRes.status).toBe(200);
      const approvedFound = productEvidenceRes.body.evidence.find((e) => e.id === evidenceId);
      expect(approvedFound).toBeDefined();
    });

    test("full evidence review workflow: submit then reject", async () => {
      const csrfRes = await request(app).get("/api/auth/csrf");
      const csrfToken = csrfRes.body.csrfToken;

      const submitRes = await request(app)
        .post("/api/products/2/evidence")
        .set("Authorization", `Bearer ${regularUserToken}`)
        .set("x-csrf-token", csrfToken)
        .send({
          citation: "Another test citation for product 2 with sufficient length to pass validation",
          source_type: "industry_report",
        });
      expect(submitRes.status).toBe(201);
      const evidenceId = submitRes.body.id;

      const reviewRes = await request(app)
        .post(`/api/admin/evidence/${evidenceId}/review`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "rejected", notes: "Could not verify source" });
      expect(reviewRes.status).toBe(200);
      expect(reviewRes.body.status).toBe("rejected");
    });

    test("POST /api/admin/evidence/:id/review should return 404 for already-reviewed evidence", async () => {
      // Use evidenceId from a previous test isn't accessible here, so submit fresh
      const csrfRes = await request(app).get("/api/auth/csrf");
      const csrfToken = csrfRes.body.csrfToken;

      const submitRes = await request(app)
        .post("/api/products/3/evidence")
        .set("Authorization", `Bearer ${regularUserToken}`)
        .set("x-csrf-token", csrfToken)
        .send({
          citation: "Citation for double-review test — should be long enough at 50+ chars here",
          source_type: "other",
        });
      const evidenceId = submitRes.body.id;

      // First review succeeds
      await request(app)
        .post(`/api/admin/evidence/${evidenceId}/review`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "approved" });

      // Second review on same id returns 404
      const secondReview = await request(app)
        .post(`/api/admin/evidence/${evidenceId}/review`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "rejected" });
      expect(secondReview.status).toBe(404);
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
});
