const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Digital Product Passport endpoints (GET /api/v1/...)", () => {
  describe("GET /api/v1/passport/:productId", () => {
    test("should return a full passport for a valid product ID", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(typeof res.body.product_name).toBe("string");
      expect(typeof res.body.brand).toBe("string");
      expect(typeof res.body.category).toBe("string");
      expect(typeof res.body.greengrade_score).toBe("number");
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(res.body.greengrade_score).toBeLessThanOrEqual(10);
      expect(typeof res.body.score_percentile).toBe("number");
      expect(res.body.emission_breakdown).toBeDefined();
      expect(typeof res.body.emission_breakdown.land_use_change).toBe("number");
      expect(typeof res.body.emission_breakdown.animal_feed).toBe("number");
      expect(typeof res.body.emission_breakdown.farm_operations).toBe("number");
      expect(typeof res.body.emission_breakdown.processing).toBe("number");
      expect(typeof res.body.emission_breakdown.transport).toBe("number");
      expect(typeof res.body.emission_breakdown.packaging).toBe("number");
      expect(typeof res.body.emission_breakdown.retail).toBe("number");
      expect(typeof res.body.total_carbon_footprint_kg_co2e).toBe("number");
      expect(typeof res.body.passport_generated_at).toBe("string");
      expect(res.body.methodology_version).toBe("3.0");
    });

    test("should return passport for a second valid product", async () => {
      const res = await request(app).get("/api/v1/passport/2");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("2");
    });

    test("should return 400 for non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/passport/inv@lid!");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("should return 404 for unknown numeric ID", async () => {
      const res = await request(app).get("/api/v1/passport/999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("data_confidence_tier and data_confidence_label are present (null or value)", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      expect("data_confidence_tier" in res.body).toBe(true);
      expect("data_confidence_label" in res.body).toBe(true);
    });
  });

  describe("POST /api/v1/portfolio/score", () => {
    test("should return portfolio summary for valid product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBe(3);
      expect(res.body.portfolio_summary).toBeDefined();
      expect(typeof res.body.portfolio_summary.average_score).toBe("number");
      expect(res.body.portfolio_summary.product_count).toBe(3);
      expect(res.body.portfolio_summary.highest).toBeDefined();
      expect(res.body.portfolio_summary.highest.id).toBeDefined();
      expect(res.body.portfolio_summary.lowest).toBeDefined();
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
    });

    test("each product in the portfolio should be a valid passport", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2"] });
      expect(res.status).toBe(200);
      for (const p of res.body.products) {
        expect(typeof p.product_id).toBe("string");
        expect(typeof p.greengrade_score).toBe("number");
        expect(p.emission_breakdown).toBeDefined();
        expect(p.methodology_version).toBe("3.0");
      }
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
    });

    test("should return 400 when product_ids has more than 100 items", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: ids });
      expect(res.status).toBe(400);
    });

    test("should return 400 when a product_id entry is not a string", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2, 3] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/string/i);
    });

    test("should return 404 when no valid products match the IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["999998", "999999"] });
      expect(res.status).toBe(404);
    });

    test("should skip invalid IDs and return results for valid ones", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "999999", "inv@lid"] });
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBe(1);
      expect(res.body.products[0].product_id).toBe("1");
    });

    test("portfolio summary highest and lowest are correct for single product", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.highest.id).toBe(res.body.portfolio_summary.lowest.id);
    });

    test("category_benchmarks include avg_score and avg_emissions", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2"] });
      expect(res.status).toBe(200);
      for (const bench of res.body.category_benchmarks) {
        expect(typeof bench.category).toBe("string");
        expect(typeof bench.count).toBe("number");
        expect(typeof bench.avg_score).toBe("number");
        expect(typeof bench.avg_emissions).toBe("number");
      }
    });
  });

  describe("GET /api/v1/audit/:productId", () => {
    test("should return audit history for a valid product", async () => {
      const res = await request(app).get("/api/v1/audit/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(typeof res.body.product_name).toBe("string");
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("should default to most recent 50 entries", async () => {
      const res = await request(app).get("/api/v1/audit/1");
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(50);
    });

    test("should respect limit query parameter", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=10");
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(10);
    });

    test("should respect offset query parameter", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=50&offset=0");
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(50);
    });

    test("should return 400 for invalid limit parameter (non-numeric)", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=abc");
      expect(res.status).toBe(400);
    });

    test("should return 400 for invalid offset parameter (non-numeric)", async () => {
      const res = await request(app).get("/api/v1/audit/1?offset=xyz");
      expect(res.status).toBe(400);
    });

    test("should return 400 for non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/inv@lid");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("should return 404 for unknown product ID", async () => {
      const res = await request(app).get("/api/v1/audit/999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });
  });
});
