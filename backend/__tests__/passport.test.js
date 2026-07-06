const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Digital Product Passport endpoints", () => {
  // Known product IDs from the catalog
  const VALID_ID = "1"; // Firm Tofu
  const VALID_ID_2 = "2"; // Beef Ribeye Steak
  const NONEXISTENT_ID = "99999";
  const INVALID_ID = "abc-123!"; // non-alphanumeric

  // ─── GET /api/v1/passport/:productId ───────────────────────────────────────

  describe("GET /api/v1/passport/:productId", () => {
    test("returns 200 with correct passport shape for a valid product", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(res.body.product_name).toBeDefined();
      expect(res.body.brand).toBeDefined();
      expect(res.body.category).toBeDefined();
      expect(typeof res.body.greengrade_score).toBe("number");
      expect(typeof res.body.total_carbon_footprint_kg_co2e).toBe("number");
      expect(res.body.emission_breakdown).toBeDefined();
      expect(res.body.passport_generated_at).toBeDefined();
      expect(res.body.methodology_version).toBe("3.0");
    });

    test("emission_breakdown contains all 7 lifecycle stages", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      const breakdown = res.body.emission_breakdown;
      expect(typeof breakdown.land_use_change).toBe("number");
      expect(typeof breakdown.animal_feed).toBe("number");
      expect(typeof breakdown.farm_operations).toBe("number");
      expect(typeof breakdown.processing).toBe("number");
      expect(typeof breakdown.transport).toBe("number");
      expect(typeof breakdown.packaging).toBe("number");
      expect(typeof breakdown.retail).toBe("number");
    });

    test("returns 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get(`/api/v1/passport/${encodeURIComponent(INVALID_ID)}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("returns 404 for a valid-format but non-existent product ID", async () => {
      const res = await request(app).get(`/api/v1/passport/${NONEXISTENT_ID}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("greengrade_score is a number between 0 and 10", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID_2}`);
      expect(res.status).toBe(200);
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(res.body.greengrade_score).toBeLessThanOrEqual(10);
    });
  });

  // ─── POST /api/v1/portfolio/score ──────────────────────────────────────────

  describe("POST /api/v1/portfolio/score", () => {
    test("returns 200 with portfolio summary for valid product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBe(2);
      expect(res.body.portfolio_summary).toBeDefined();
      expect(typeof res.body.portfolio_summary.average_score).toBe("number");
      expect(res.body.portfolio_summary.product_count).toBe(2);
      expect(res.body.portfolio_summary.highest).toBeDefined();
      expect(res.body.portfolio_summary.lowest).toBeDefined();
    });

    test("portfolio_summary highest/lowest are correct relative to each other", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2] });
      expect(res.status).toBe(200);
      const { highest, lowest } = res.body.portfolio_summary;
      expect(highest.score).toBeGreaterThanOrEqual(lowest.score);
    });

    test("category_benchmarks groups products correctly", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
      // Both products are Protein, so there should be exactly one benchmark entry
      const proteinBench = res.body.category_benchmarks.find((b) => b.category === "Protein");
      expect(proteinBench).toBeDefined();
      expect(proteinBench.count).toBe(2);
    });

    test("silently skips non-existent IDs and scores remaining valid ones", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, NONEXISTENT_ID] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(1);
    });

    test("returns 400 when product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 when product_ids is not an array", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: VALID_ID });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/array/i);
    });

    test("returns 400 when product_ids array is empty", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [] });
      expect(res.status).toBe(400);
    });

    test("returns 400 when product_ids array exceeds 100 items", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ids });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/100/);
    });

    test("returns 400 when product_ids contains non-string entries", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/string/i);
    });

    test("returns 404 when all product_ids are invalid or non-existent", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [NONEXISTENT_ID, "88888"] });
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });
  });

  // ─── GET /api/v1/audit/:productId ──────────────────────────────────────────

  describe("GET /api/v1/audit/:productId", () => {
    test("returns 200 with audit structure for a valid product", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(res.body.product_name).toBeDefined();
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("returns 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get(`/api/v1/audit/${encodeURIComponent(INVALID_ID)}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("returns 404 for a valid-format but non-existent product ID", async () => {
      const res = await request(app).get(`/api/v1/audit/${NONEXISTENT_ID}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("respects limit query parameter", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=5`);
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("returns 400 for a non-numeric limit", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=abc`);
      expect(res.status).toBe(400);
    });

    test("returns 400 for a non-numeric offset", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?offset=xyz`);
      expect(res.status).toBe(400);
    });
  });
});
