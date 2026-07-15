const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Digital Product Passport endpoints", () => {
  // ── GET /api/v1/passport/:productId ──────────────────────────────────
  describe("GET /api/v1/passport/:productId", () => {
    test("should return a valid passport for a known product", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body.product_name).toBeDefined();
      expect(res.body.brand).toBeDefined();
      expect(res.body.category).toBeDefined();
      expect(typeof res.body.greengrade_score).toBe("number");
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(res.body.greengrade_score).toBeLessThanOrEqual(10);
      expect(typeof res.body.score_percentile).toBe("number");
      expect(res.body.total_carbon_footprint_kg_co2e).toBeGreaterThanOrEqual(0);
      expect(res.body.methodology_version).toBe("3.0");
      expect(res.body.passport_generated_at).toBeDefined();
    });

    test("should include all 7 emission breakdown fields", async () => {
      const res = await request(app).get("/api/v1/passport/2");
      expect(res.status).toBe(200);
      const b = res.body.emission_breakdown;
      expect(b).toBeDefined();
      expect(typeof b.land_use_change).toBe("number");
      expect(typeof b.animal_feed).toBe("number");
      expect(typeof b.farm_operations).toBe("number");
      expect(typeof b.processing).toBe("number");
      expect(typeof b.transport).toBe("number");
      expect(typeof b.packaging).toBe("number");
      expect(typeof b.retail).toBe("number");
    });

    test("should return 404 for an unknown product ID", async () => {
      const res = await request(app).get("/api/v1/passport/999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("should return 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/passport/bad-id!");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("should return valid passport for product 3", async () => {
      const res = await request(app).get("/api/v1/passport/3");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("3");
    });
  });

  // ── POST /api/v1/portfolio/score ──────────────────────────────────────
  describe("POST /api/v1/portfolio/score", () => {
    test("should score a portfolio of valid product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products).toHaveLength(3);
      expect(res.body.portfolio_summary).toBeDefined();
      expect(typeof res.body.portfolio_summary.average_score).toBe("number");
      expect(res.body.portfolio_summary.product_count).toBe(3);
      expect(res.body.portfolio_summary.highest).toBeDefined();
      expect(res.body.portfolio_summary.lowest).toBeDefined();
    });

    test("should return category_benchmarks", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
      const bench = res.body.category_benchmarks[0];
      expect(bench).toHaveProperty("category");
      expect(bench).toHaveProperty("count");
      expect(bench).toHaveProperty("avg_score");
      expect(bench).toHaveProperty("avg_emissions");
    });

    test("portfolio_summary.highest should have the max score", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);
      const scores = res.body.products.map((p) => p.greengrade_score);
      const max = Math.max(...scores);
      expect(res.body.portfolio_summary.highest.score).toBe(max);
    });

    test("portfolio_summary.lowest should have the min score", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);
      const scores = res.body.products.map((p) => p.greengrade_score);
      const min = Math.min(...scores);
      expect(res.body.portfolio_summary.lowest.score).toBe(min);
    });

    test("should skip invalid IDs silently and score valid ones", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "999999"] });
      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.portfolio_summary.product_count).toBe(1);
    });

    test("should return 404 when all IDs are invalid", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["999997", "999998", "999999"] });
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("should return 400 when product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
    });

    test("should return 400 when product_ids is not an array", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: "1" });
      expect(res.status).toBe(400);
    });

    test("should return 400 when product_ids is empty", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [] });
      expect(res.status).toBe(400);
    });

    test("should return 400 when product_ids has non-string entries", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2, 3] });
      expect(res.status).toBe(400);
    });

    test("should handle a single product portfolio", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(1);
      const { highest, lowest } = res.body.portfolio_summary;
      expect(highest.score).toBe(lowest.score);
    });
  });

  // ── GET /api/v1/audit/:productId ──────────────────────────────────────
  describe("GET /api/v1/audit/:productId", () => {
    test("should return audit history for a known product", async () => {
      const res = await request(app).get("/api/v1/audit/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body.product_name).toBeDefined();
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("should default to max 50 entries", async () => {
      const res = await request(app).get("/api/v1/audit/1");
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(50);
    });

    test("should accept limit and offset query params", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=5&offset=0");
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("should return 400 for non-numeric limit", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=abc");
      expect(res.status).toBe(400);
    });

    test("should return 400 for non-numeric offset", async () => {
      const res = await request(app).get("/api/v1/audit/1?offset=xyz");
      expect(res.status).toBe(400);
    });

    test("should return 404 for an unknown product", async () => {
      const res = await request(app).get("/api/v1/audit/999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("should return 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/bad@id");
      expect(res.status).toBe(400);
    });
  });
});
