const request = require("supertest");
const { randomUUID } = require("crypto");

process.env.NODE_ENV = "test";
const app = require("../src/index");
const { getDb } = require("../src/db/schema");
const {
  seedPublishedScores,
  detectPublicationDrift,
  getPublishedScore,
  getPendingPublications,
  approvePublication,
  rejectPublication,
} = require("../src/services/scorePublication");

const FAKE_PRODUCTS = [
  {
    id: "pub-test-1",
    name: "Test Product A",
    brand: "TestBrand",
    category: "Grains",
    emissions: { landUseChange: 0.3, animalFeed: 0, farm: 1, processing: 0.5, transport: 0.3, packaging: 0.2, retail: 0.2 },
  },
  {
    id: "pub-test-2",
    name: "Test Product B",
    brand: "TestBrand",
    category: "Protein",
    emissions: { landUseChange: 5, animalFeed: 4, farm: 12, processing: 1, transport: 0.8, packaging: 0.5, retail: 0.3 },
  },
];

function fakeScoreFn(grade) {
  return (_p) => ({ score: grade, breakdown: [] });
}

// Helper: directly insert a published score row for test products
function insertPublishedScore(db, productId, grade) {
  db.prepare(
    `INSERT OR REPLACE INTO published_scores
       (product_id, grade, grade_label, breakdown, published_by, methodology_version, catalog_hash)
     VALUES (?, ?, ?, '[]', 'system:test', '3.0', 'testhash')`
  ).run(productId, grade, grade >= 7 ? "green" : grade >= 4 ? "amber" : "red");
}

describe("Score Publication service", () => {
  let db;

  beforeEach(() => {
    db = getDb();
    db.prepare("DELETE FROM published_scores WHERE product_id LIKE 'pub-test-%'").run();
    db.prepare("DELETE FROM pending_score_publications WHERE product_id LIKE 'pub-test-%'").run();
  });

  describe("seedPublishedScores", () => {
    test("seeds products into empty table subset (idempotency path)", () => {
      // seedPublishedScores only acts when the entire table is empty; since the
      // app seeds 550 real products at startup, we just verify it returns 0 on
      // subsequent calls (the table is non-empty).
      const count = seedPublishedScores(FAKE_PRODUCTS, fakeScoreFn(7.5));
      expect(count).toBe(0); // table already seeded at startup
    });

    test("seeded products are retrievable by getPublishedScore", () => {
      // Verify the real startup seed populated product "1" from the catalog
      const pub = getPublishedScore("1");
      expect(pub).not.toBeNull();
      expect(typeof pub.grade).toBe("number");
      expect(pub.publishedBy).toBe("system:initial-seed");
    });
  });

  describe("detectPublicationDrift", () => {
    test("queues drifted products for review", () => {
      insertPublishedScore(db, "pub-test-1", 7.5);
      insertPublishedScore(db, "pub-test-2", 7.5);
      const queued = detectPublicationDrift(FAKE_PRODUCTS, fakeScoreFn(6.0));
      expect(queued).toBe(2);
      const pending = getPendingPublications();
      const ids = pending.map((r) => r.product_id);
      expect(ids).toContain("pub-test-1");
      expect(ids).toContain("pub-test-2");
    });

    test("does not queue when score is unchanged", () => {
      insertPublishedScore(db, "pub-test-1", 7.5);
      insertPublishedScore(db, "pub-test-2", 7.5);
      const queued = detectPublicationDrift(FAKE_PRODUCTS, fakeScoreFn(7.5));
      expect(queued).toBe(0);
    });

    test("is idempotent — duplicate drift does not create duplicate pending rows", () => {
      insertPublishedScore(db, "pub-test-1", 7.5);
      insertPublishedScore(db, "pub-test-2", 7.5);
      detectPublicationDrift(FAKE_PRODUCTS, fakeScoreFn(6.0));
      detectPublicationDrift(FAKE_PRODUCTS, fakeScoreFn(6.0));
      const pending = getPendingPublications();
      const forProduct1 = pending.filter((r) => r.product_id === "pub-test-1");
      expect(forProduct1).toHaveLength(1);
    });
  });

  describe("approvePublication", () => {
    test("approves pending publication and updates published_scores", () => {
      insertPublishedScore(db, "pub-test-1", 7.5);
      db.prepare(
        `INSERT INTO pending_score_publications (product_id, product_name, old_grade, new_grade, new_breakdown)
         VALUES ('pub-test-1', 'Test Product A', 7.5, 6.0, '[]')`
      ).run();
      const [pending] = getPendingPublications({ limit: 1, offset: 0 });
      const result = approvePublication(pending.id, "admin:test@example.com", "Approved in test");
      expect(result).not.toBeNull();
      expect(result.newGrade).toBe(6.0);
      expect(getPublishedScore("pub-test-1").grade).toBe(6.0);
    });

    test("returns null for non-existent or already-reviewed ID", () => {
      expect(approvePublication(999999, "admin:test@example.com")).toBeNull();
    });
  });

  describe("rejectPublication", () => {
    test("rejects pending publication without updating published_scores", () => {
      insertPublishedScore(db, "pub-test-1", 7.5);
      db.prepare(
        `INSERT INTO pending_score_publications (product_id, product_name, old_grade, new_grade, new_breakdown)
         VALUES ('pub-test-1', 'Test Product A', 7.5, 6.0, '[]')`
      ).run();
      const [pending] = getPendingPublications({ limit: 1, offset: 0 });
      const ok = rejectPublication(pending.id, "admin:test@example.com", "Not ready");
      expect(ok).toBe(true);
      expect(getPublishedScore("pub-test-1").grade).toBe(7.5);
    });

    test("returns false for non-existent ID", () => {
      expect(rejectPublication(999999, "admin:test@example.com")).toBe(false);
    });
  });
});

describe("Admin score publication endpoints", () => {
  let adminToken;
  let userToken;
  const adminEmail = `pub-admin-${randomUUID().slice(0, 8)}@example.com`;
  const userEmail = `pub-user-${randomUUID().slice(0, 8)}@example.com`;

  beforeAll(async () => {
    const adminRes = await request(app).post("/api/auth/register").send({
      name: "Pub Admin",
      email: adminEmail,
      password: "PubAdminPass1",
    });
    adminToken = adminRes.body.token;
    getDb().prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(adminEmail);

    const userRes = await request(app).post("/api/auth/register").send({
      name: "Pub User",
      email: userEmail,
      password: "PubUserPass1",
    });
    userToken = userRes.body.token;
  });

  describe("GET /api/admin/pending-publications", () => {
    test("returns 401 for unauthenticated requests", async () => {
      const res = await request(app).get("/api/admin/pending-publications");
      expect(res.status).toBe(401);
    });

    test("returns 403 for non-admin users", async () => {
      const res = await request(app)
        .get("/api/admin/pending-publications")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    test("returns pending publications for admin", async () => {
      const res = await request(app)
        .get("/api/admin/pending-publications")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("publications");
      expect(Array.isArray(res.body.publications)).toBe(true);
      expect(res.body).toHaveProperty("total");
    });
  });

  describe("POST /api/admin/pending-publications/:id/approve", () => {
    test("returns 404 for non-existent publication ID", async () => {
      const res = await request(app)
        .post("/api/admin/pending-publications/999999/approve")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(404);
    });

    test("returns 400 for non-numeric ID", async () => {
      const res = await request(app)
        .post("/api/admin/pending-publications/abc/approve")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/admin/pending-publications/:id/reject", () => {
    test("returns 404 for non-existent publication ID", async () => {
      const res = await request(app)
        .post("/api/admin/pending-publications/999999/reject")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(404);
    });
  });
});

describe("Passport endpoint publication_status field", () => {
  test("GET /api/v1/passport/:id includes publication_status", async () => {
    const res = await request(app).get("/api/v1/passport/1");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("publication_status");
    expect(["published", "pending_update", "not_published"]).toContain(
      res.body.publication_status
    );
    expect(res.body).toHaveProperty("computed_score");
    expect(res.body).toHaveProperty("greengrade_score");
  });

  test("passport includes published_at when score is published", async () => {
    const res = await request(app).get("/api/v1/passport/1");
    expect(res.status).toBe(200);
    if (res.body.publication_status === "published") {
      expect(res.body.published_at).not.toBeNull();
    }
  });
});
