const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Digital Product Passport API", () => {
  describe("GET /api/v1/passport/:productId", () => {
    test("should return a passport for a valid product", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(res.body.emission_breakdown).toHaveProperty("land_use_change");
      expect(res.body.emission_breakdown).toHaveProperty("animal_feed");
      expect(res.body.emission_breakdown).toHaveProperty("farm_operations");
      expect(res.body.emission_breakdown).toHaveProperty("processing");
      expect(res.body.emission_breakdown).toHaveProperty("transport");
      expect(res.body.emission_breakdown).toHaveProperty("packaging");
      expect(res.body.emission_breakdown).toHaveProperty("retail");
      expect(res.body.methodology_version).toBe("3.0");
      expect(res.body.passport_generated_at).toBeDefined();
    });

    test("should 404 for a non-existent product", async () => {
      const res = await request(app).get("/api/v1/passport/999999");
      expect(res.status).toBe(404);
    });

    test("should 400 for a non-alphanumeric product id", async () => {
      const res = await request(app).get("/api/v1/passport/1%3Bdrop");
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v1/portfolio/score", () => {
    test("should score a portfolio of valid product ids", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(3);
      expect(res.body.portfolio_summary.product_count).toBe(3);
      expect(res.body.portfolio_summary.highest).toBeDefined();
      expect(res.body.portfolio_summary.lowest).toBeDefined();
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
    });

    test("should skip invalid ids but score valid ones", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "does-not-exist"] });
      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(1);
    });

    test("should 404 when no valid products are found", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["999999"] });
      expect(res.status).toBe(404);
    });

    test("should 400 when product_ids is not an array", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: "1" });
      expect(res.status).toBe(400);
    });

    test("should 400 when product_ids exceeds 100 entries", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i));
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: ids });
      expect(res.status).toBe(400);
    });

    test("should 400 when product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/audit/:productId", () => {
    test("should return an audit trail for a valid product", async () => {
      const res = await request(app).get("/api/v1/audit/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("should respect limit and offset", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=5&offset=0");
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("should 400 for a non-numeric limit", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=abc");
      expect(res.status).toBe(400);
    });

    test("should 404 for a non-existent product", async () => {
      const res = await request(app).get("/api/v1/audit/999999");
      expect(res.status).toBe(404);
    });
  });
});
