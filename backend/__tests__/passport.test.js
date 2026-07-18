const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

// Use product IDs known to exist in products.json
const VALID_ID = "1";
const VALID_ID_2 = "2";
const VALID_ID_3 = "3";

describe("Digital Product Passport API (/api/v1)", () => {
  describe("GET /api/v1/passport/:productId", () => {
    test("should return a full passport for a valid product", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(res.body.product_name).toBeDefined();
      expect(res.body.brand).toBeDefined();
      expect(res.body.category).toBeDefined();
      expect(typeof res.body.greengrade_score).toBe("number");
      expect(typeof res.body.score_percentile).toBe("number");
      expect(res.body.emission_breakdown).toBeDefined();
      expect(res.body.total_carbon_footprint_kg_co2e).toBeDefined();
      expect(res.body.passport_generated_at).toBeDefined();
      expect(res.body.methodology_version).toBe("3.0");
    });

    test("emission_breakdown should have all 7 supply-chain fields", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      const eb = res.body.emission_breakdown;
      expect(eb.land_use_change).toBeDefined();
      expect(eb.animal_feed).toBeDefined();
      expect(eb.farm_operations).toBeDefined();
      expect(eb.processing).toBeDefined();
      expect(eb.transport).toBeDefined();
      expect(eb.packaging).toBeDefined();
      expect(eb.retail).toBeDefined();
    });

    test("should return 404 for an unknown product ID", async () => {
      const res = await request(app).get("/api/v1/passport/999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });

    test("should return 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/passport/bad-id!");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid/i);
    });
  });

  describe("POST /api/v1/portfolio/score", () => {
    test("should score a batch of valid product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2, VALID_ID_3] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBe(3);
      expect(res.body.portfolio_summary).toBeDefined();
      expect(typeof res.body.portfolio_summary.average_score).toBe("number");
      expect(res.body.portfolio_summary.product_count).toBe(3);
      expect(res.body.portfolio_summary.highest).toBeDefined();
      expect(res.body.portfolio_summary.lowest).toBeDefined();
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
    });

    test("should work with a single product ID", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID] });
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBe(1);
      expect(res.body.portfolio_summary.product_count).toBe(1);
      const s = res.body.portfolio_summary;
      expect(s.highest.id).toBe(s.lowest.id);
    });

    test("should return 400 when product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
    });

    test("should return 400 when product_ids is not an array", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: "1,2,3" });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/array/i);
    });

    test("should return 400 when product_ids is empty", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: [] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/between 1 and 100/i);
    });

    test("should return 400 when product_ids exceeds 100 items", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: ids });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/between 1 and 100/i);
    });

    test("should return 400 when any entry is not a string", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/string/i);
    });

    test("should return 404 when all product IDs are invalid", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["999999", "888888"] });
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/no valid products/i);
    });

    test("category_benchmarks should aggregate correctly", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2] });
      expect(res.status).toBe(200);
      for (const bench of res.body.category_benchmarks) {
        expect(bench.category).toBeDefined();
        expect(typeof bench.count).toBe("number");
        expect(typeof bench.avg_score).toBe("number");
        expect(typeof bench.avg_emissions).toBe("number");
      }
    });
  });

  describe("GET /api/v1/audit/:productId", () => {
    test("should return audit entries for a valid product", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(res.body.product_name).toBeDefined();
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("should respect limit and offset query parameters", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=5&offset=0`);
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("should return 404 for unknown product", async () => {
      const res = await request(app).get("/api/v1/audit/999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });

    test("should return 400 for non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/bad-id!");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid/i);
    });

    test("should return 400 for non-integer limit", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=abc`);
      expect(res.status).toBe(400);
    });
  });
});
