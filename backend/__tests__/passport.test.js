const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

// Product "1" (Firm Tofu) is always present in the 550-product catalog.
const VALID_ID = "1";
const MISSING_ID = "999999";
const INVALID_ID = "bad-id!";

describe("Digital Product Passport API (/api/v1)", () => {
  describe("GET /api/v1/passport/:productId", () => {
    test("returns a full passport for a known product", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(typeof res.body.product_name).toBe("string");
      expect(typeof res.body.brand).toBe("string");
      expect(typeof res.body.category).toBe("string");
      expect(typeof res.body.greengrade_score).toBe("number");
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(res.body.greengrade_score).toBeLessThanOrEqual(10);
      expect(typeof res.body.score_percentile).toBe("number");
      expect(res.body.emission_breakdown).toHaveProperty("land_use_change");
      expect(res.body.emission_breakdown).toHaveProperty("animal_feed");
      expect(res.body.emission_breakdown).toHaveProperty("farm_operations");
      expect(res.body.emission_breakdown).toHaveProperty("processing");
      expect(res.body.emission_breakdown).toHaveProperty("transport");
      expect(res.body.emission_breakdown).toHaveProperty("packaging");
      expect(res.body.emission_breakdown).toHaveProperty("retail");
      expect(typeof res.body.total_carbon_footprint_kg_co2e).toBe("number");
      expect(res.body.methodology_version).toBe("3.0");
      expect(typeof res.body.passport_generated_at).toBe("string");
    });

    test("returns 404 for an unknown product ID", async () => {
      const res = await request(app).get(`/api/v1/passport/${MISSING_ID}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for an invalid (non-alphanumeric) product ID", async () => {
      const res = await request(app).get(`/api/v1/passport/${encodeURIComponent(INVALID_ID)}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe("POST /api/v1/portfolio/score", () => {
    test("returns portfolio summary for valid product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, "2", "3"] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBeGreaterThan(0);
      expect(res.body.portfolio_summary).toBeDefined();
      expect(typeof res.body.portfolio_summary.average_score).toBe("number");
      expect(typeof res.body.portfolio_summary.product_count).toBe("number");
      expect(res.body.portfolio_summary.highest).toHaveProperty("id");
      expect(res.body.portfolio_summary.highest).toHaveProperty("score");
      expect(res.body.portfolio_summary.lowest).toHaveProperty("id");
      expect(res.body.portfolio_summary.lowest).toHaveProperty("score");
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
    });

    test("silently skips unknown IDs and returns remaining valid passports", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, MISSING_ID] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(1);
    });

    test("returns 404 when all IDs are unknown", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [MISSING_ID] });
      expect(res.status).toBe(404);
    });

    test("returns 400 when product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
    });

    test("returns 400 when product_ids is not an array", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: VALID_ID });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("array");
    });

    test("returns 400 when product_ids is empty", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [] });
      expect(res.status).toBe(400);
    });

    test("returns 400 when a product_ids entry is not a string", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2] });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("category_benchmarks averages are numbers", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, "2"] });
      expect(res.status).toBe(200);
      for (const bench of res.body.category_benchmarks) {
        expect(typeof bench.category).toBe("string");
        expect(typeof bench.avg_score).toBe("number");
        expect(typeof bench.avg_emissions).toBe("number");
      }
    });
  });

  describe("GET /api/v1/audit/:productId", () => {
    test("returns audit trail structure for a known product", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(typeof res.body.product_name).toBe("string");
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("accepts limit and offset query params", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=5&offset=0`);
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("returns 404 for an unknown product ID", async () => {
      const res = await request(app).get(`/api/v1/audit/${MISSING_ID}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for an invalid product ID", async () => {
      const res = await request(app).get(`/api/v1/audit/${encodeURIComponent(INVALID_ID)}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for non-numeric limit", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=abc`);
      expect(res.status).toBe(400);
    });
  });
});
