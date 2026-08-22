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

  describe("Pending score publication workflow", () => {
    const crypto = require("crypto");
    let pendingId;

    beforeAll(() => {
      // Use product_id '1' (already in product_scores after rescore) so publishing
      // triggers an UPSERT that doesn't add a new row and break the 550-count assertion.
      const db = getDb();
      pendingId = crypto.randomUUID();
      db.prepare(
        `INSERT INTO pending_score_changes
           (id, product_id, product_name, old_score, new_score, score_delta, staged_by, stage_reason, status)
         VALUES (?, '1', 'Apples', 5.0, 6.5, 1.5, 'admin:setup', 'test stage', 'pending')`
      ).run(pendingId);
    });

    describe("GET /api/admin/pending-scores", () => {
      test("should return pending changes array", async () => {
        const res = await request(app)
          .get("/api/admin/pending-scores")
          .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("changes");
        expect(Array.isArray(res.body.changes)).toBe(true);
        expect(res.body).toHaveProperty("total");
      });

      test("should include the seeded pending change", async () => {
        const res = await request(app)
          .get("/api/admin/pending-scores")
          .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        const entry = res.body.changes.find((c) => c.id === pendingId);
        expect(entry).toBeDefined();
        expect(entry.status).toBe("pending");
        expect(typeof entry.product_name).toBe("string");
      });

      test("should require admin", async () => {
        const res = await request(app)
          .get("/api/admin/pending-scores")
          .set("Authorization", `Bearer ${userToken}`);
        expect(res.status).toBe(403);
      });

      test("should reject invalid limit", async () => {
        const res = await request(app)
          .get("/api/admin/pending-scores?limit=abc")
          .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(400);
      });
    });

    describe("POST /api/admin/rescore?mode=stage", () => {
      test("should return staged array not changes", async () => {
        const res = await request(app)
          .post("/api/admin/rescore?mode=stage")
          .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("staged");
        expect(Array.isArray(res.body.staged)).toBe(true);
        expect(res.body.message).toMatch(/staged/);
      });

      test("should reject invalid mode", async () => {
        const res = await request(app)
          .post("/api/admin/rescore?mode=bad")
          .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(400);
      });
    });

    describe("POST /api/admin/pending-scores/:id/publish", () => {
      test("should publish a pending change and create an audit entry", async () => {
        const db = getDb();
        const beforeCount = db.prepare("SELECT COUNT(*) as c FROM score_change_logs").get().c;

        const res = await request(app)
          .post(`/api/admin/pending-scores/${pendingId}/publish`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ notes: "Verified externally" });

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/published/);
        expect(res.body.change).toHaveProperty("id", pendingId);

        const row = db.prepare("SELECT status FROM pending_score_changes WHERE id = ?").get(pendingId);
        expect(row.status).toBe("published");

        const afterCount = db.prepare("SELECT COUNT(*) as c FROM score_change_logs").get().c;
        expect(afterCount).toBeGreaterThan(beforeCount);
      });

      test("should return 404 when publishing an already-reviewed change", async () => {
        const res = await request(app)
          .post(`/api/admin/pending-scores/${pendingId}/publish`)
          .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(404);
      });
    });

    describe("POST /api/admin/pending-scores/:id/reject", () => {
      let rejectId;

      beforeAll(() => {
        const db = getDb();
        rejectId = crypto.randomUUID();
        db.prepare(
          `INSERT INTO pending_score_changes
             (id, product_id, product_name, old_score, new_score, score_delta, staged_by, stage_reason, status)
           VALUES (?, '2', 'Bananas', 4.0, 5.5, 1.5, 'admin:setup', 'test reject', 'pending')`
        ).run(rejectId);
      });

      test("should reject a pending change without creating an audit entry", async () => {
        const db = getDb();
        const beforeCount = db.prepare("SELECT COUNT(*) as c FROM score_change_logs").get().c;

        const res = await request(app)
          .post(`/api/admin/pending-scores/${rejectId}/reject`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ notes: "Insufficient evidence" });

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/rejected/);

        const row = db.prepare("SELECT status, review_notes FROM pending_score_changes WHERE id = ?").get(rejectId);
        expect(row.status).toBe("rejected");
        expect(row.review_notes).toBe("Insufficient evidence");

        const afterCount = db.prepare("SELECT COUNT(*) as c FROM score_change_logs").get().c;
        expect(afterCount).toBe(beforeCount);
      });

      test("should return 404 for already-rejected change", async () => {
        const res = await request(app)
          .post(`/api/admin/pending-scores/${rejectId}/reject`)
          .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(404);
      });

      test("should return 404 for nonexistent change", async () => {
        const res = await request(app)
          .post(`/api/admin/pending-scores/nonexistent-id/reject`)
          .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(404);
      });
    });
  });
});
