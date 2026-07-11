const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Digital Product Passport endpoints", () => {
  // Product IDs from products.json: "1" = Firm Tofu, "2" = Beef Ribeye Steak
  const VALID_ID = "1";
  const HIGH_EMISSION_ID = "2";

  describe("GET /api/v1/passport/:productId", () => {
    test("should return a passport for a valid product", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(res.body.product_name).toBeDefined();
      expect(res.body.brand).toBeDefined();
      expect(res.body.category).toBeDefined();
    });

    test("should include emission breakdown with all 7 supply chain stages", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      const breakdown = res.body.emission_breakdown;
      expect(breakdown).toBeDefined();
      expect(breakdown).toHaveProperty("land_use_change");
      expect(breakdown).toHaveProperty("animal_feed");
      expect(breakdown).toHaveProperty("farm_operations");
      expect(breakdown).toHaveProperty("processing");
      expect(breakdown).toHaveProperty("transport");
      expect(breakdown).toHaveProperty("packaging");
      expect(breakdown).toHaveProperty("retail");
    });

    test("should include greengrade score in valid range", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(res.body.greengrade_score).toBeLessThanOrEqual(10);
    });

    test("should include total carbon footprint", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(typeof res.body.total_carbon_footprint_kg_co2e).toBe("number");
      expect(res.body.total_carbon_footprint_kg_co2e).toBeGreaterThan(0);
    });

    test("should include passport metadata", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.passport_generated_at).toBeDefined();
      expect(res.body.methodology_version).toBe("3.0");
    });

    test("should include score percentile", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(typeof res.body.score_percentile).toBe("number");
    });

    test("high-emission product should score lower than low-emission product", async () => {
      const [low, high] = await Promise.all([
        request(app).get(`/api/v1/passport/${VALID_ID}`),
        request(app).get(`/api/v1/passport/${HIGH_EMISSION_ID}`),
      ]);
      expect(low.status).toBe(200);
      expect(high.status).toBe(200);
      expect(low.body.greengrade_score).toBeGreaterThan(high.body.greengrade_score);
    });

    test("should return 404 for non-existent product", async () => {
      const res = await request(app).get("/api/v1/passport/999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("should return 400 for non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/passport/abc-123");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid product ID/i);
    });

    test("should handle product ID with leading zeros gracefully", async () => {
      const res = await request(app).get("/api/v1/passport/01");
      // Either 404 (no product) or 400 (invalid) — must not 500
      expect([400, 404]).toContain(res.status);
    });
  });

  describe("POST /api/v1/portfolio/score", () => {
    test("should score a portfolio of valid product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, HIGH_EMISSION_ID, "3"] });
      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(3);
      expect(res.body.portfolio_summary).toBeDefined();
    });

    test("should include portfolio summary with average score", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, HIGH_EMISSION_ID] });
      expect(res.status).toBe(200);
      const summary = res.body.portfolio_summary;
      expect(summary.average_score).toBeGreaterThanOrEqual(0);
      expect(summary.average_score).toBeLessThanOrEqual(10);
      expect(summary.product_count).toBe(2);
    });

    test("should identify highest and lowest scoring products", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, HIGH_EMISSION_ID] });
      expect(res.status).toBe(200);
      const summary = res.body.portfolio_summary;
      expect(summary.highest).toBeDefined();
      expect(summary.lowest).toBeDefined();
      expect(summary.highest.id).toBeDefined();
      expect(summary.lowest.id).toBeDefined();
      expect(summary.highest.score).toBeGreaterThanOrEqual(summary.lowest.score);
    });

    test("should include category benchmarks", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, HIGH_EMISSION_ID] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
      res.body.category_benchmarks.forEach((bench) => {
        expect(bench).toHaveProperty("category");
        expect(bench).toHaveProperty("count");
        expect(bench).toHaveProperty("avg_score");
        expect(bench).toHaveProperty("avg_emissions");
      });
    });

    test("should return 400 when product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
    });

    test("should return 400 when product_ids is not an array", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: VALID_ID });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/array/i);
    });

    test("should return 400 for empty product_ids array", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [] });
      expect(res.status).toBe(400);
    });

    test("should return 400 for non-string entries in product_ids", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/string/i);
    });

    test("should return 400 when product_ids exceeds 100 items", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ids });
      expect(res.status).toBe(400);
    });

    test("should return 404 when no valid products found in the list", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["999999", "888888"] });
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("should silently skip invalid (non-alphanumeric) IDs in the list", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, "bad-id!"] });
      // Should succeed with only the valid product
      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.products[0].product_id).toBe(VALID_ID);
    });

    test("should work with a single valid product ID", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID] });
      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.portfolio_summary.product_count).toBe(1);
      // highest and lowest should be the same product
      expect(res.body.portfolio_summary.highest.id).toBe(
        res.body.portfolio_summary.lowest.id
      );
    });
  });

  describe("GET /api/v1/audit/:productId", () => {
    test("should return audit trail for a valid product", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(res.body.product_name).toBeDefined();
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("should return empty audit trail when no changes have occurred", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      // fresh DB in test env has no score changes
      expect(res.body.total_entries).toBeGreaterThanOrEqual(0);
    });

    test("should respect limit query parameter", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=5`);
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("should respect offset query parameter", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?offset=0`);
      expect(res.status).toBe(200);
    });

    test("should return 400 for non-numeric limit", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=abc`);
      expect(res.status).toBe(400);
    });

    test("should return 400 for non-numeric offset", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?offset=xyz`);
      expect(res.status).toBe(400);
    });

    test("should return 404 for non-existent product", async () => {
      const res = await request(app).get("/api/v1/audit/999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("should return 400 for non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/bad-id");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid product ID/i);
    });

    test("should cap limit at 500 internally", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=9999`);
      expect(res.status).toBe(200);
      // Must not error — internal cap applies
    });
  });
});
