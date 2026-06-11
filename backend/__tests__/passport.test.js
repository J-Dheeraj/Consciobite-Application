const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Digital Product Passport API", () => {
  describe("GET /api/v1/passport/:productId", () => {
    test("returns a passport for a valid product ID", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body.product_name).toBe("Firm Tofu");
      expect(res.body).toHaveProperty("greengrade_score");
      expect(res.body).toHaveProperty("score_percentile");
      expect(res.body).toHaveProperty("emission_breakdown");
      expect(res.body).toHaveProperty("total_carbon_footprint_kg_co2e");
      expect(res.body).toHaveProperty("passport_generated_at");
      expect(res.body.methodology_version).toBe("3.0");
    });

    test("emission_breakdown has all 7 supply-chain fields", async () => {
      const res = await request(app).get("/api/v1/passport/2");
      expect(res.status).toBe(200);
      const breakdown = res.body.emission_breakdown;
      const expected = [
        "land_use_change",
        "animal_feed",
        "farm_operations",
        "processing",
        "transport",
        "packaging",
        "retail",
      ];
      expected.forEach((field) => expect(breakdown).toHaveProperty(field));
    });

    test("returns 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/passport/abc-123");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid product id/i);
    });

    test("returns 404 for a valid-format but non-existent product ID", async () => {
      const res = await request(app).get("/api/v1/passport/99999");
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });

    test("greengrade_score is a number between 0 and 10", async () => {
      const res = await request(app).get("/api/v1/passport/3");
      expect(res.status).toBe(200);
      expect(typeof res.body.greengrade_score).toBe("number");
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(res.body.greengrade_score).toBeLessThanOrEqual(10);
    });
  });

  describe("POST /api/v1/portfolio/score", () => {
    test("scores a valid array of product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products).toHaveLength(3);
      expect(res.body).toHaveProperty("portfolio_summary");
      expect(res.body.portfolio_summary).toHaveProperty("average_score");
      expect(res.body.portfolio_summary).toHaveProperty("product_count", 3);
      expect(res.body.portfolio_summary).toHaveProperty("highest");
      expect(res.body.portfolio_summary).toHaveProperty("lowest");
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
    });

    test("returns 400 when product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
    });

    test("returns 400 when product_ids is not an array", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: "1" });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/must be an array/i);
    });

    test("returns 400 when product_ids is empty", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/between 1 and 100/i);
    });

    test("returns 400 when product_ids exceeds 100 items", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ids });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/between 1 and 100/i);
    });

    test("returns 400 when a product_ids entry is not a string", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/must be a string/i);
    });

    test("returns 404 when no valid products are found", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["99998", "99999"] });
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/no valid products/i);
    });

    test("silently skips invalid IDs and scores remaining valid products", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "abc-xyz", "99999"] });
      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.portfolio_summary.product_count).toBe(1);
    });

    test("average_score is within 0–10 range", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3", "4", "5"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.average_score).toBeGreaterThanOrEqual(0);
      expect(res.body.portfolio_summary.average_score).toBeLessThanOrEqual(10);
    });
  });

  describe("GET /api/v1/audit/:productId", () => {
    test("returns audit trail for a valid product", async () => {
      const res = await request(app).get("/api/v1/audit/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body.product_name).toBeDefined();
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("returns 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/abc-def");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid product id/i);
    });

    test("returns 404 for a valid-format but non-existent product ID", async () => {
      const res = await request(app).get("/api/v1/audit/99999");
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });

    test("respects limit and offset query parameters", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=5&offset=0");
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("returns 400 for non-numeric limit", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=abc");
      expect(res.status).toBe(400);
    });
  });
});
