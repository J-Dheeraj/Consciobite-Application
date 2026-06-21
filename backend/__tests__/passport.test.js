const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Digital Product Passport API", () => {
  describe("GET /api/v1/passport/:productId", () => {
    test("should return a passport for a valid product", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body).toHaveProperty("greengrade_score");
      expect(res.body).toHaveProperty("emission_breakdown");
      expect(res.body.emission_breakdown).toHaveProperty("land_use_change");
      expect(res.body).toHaveProperty("total_carbon_footprint_kg_co2e");
      expect(res.body.methodology_version).toBe("3.0");
    });

    test("should reject a non-alphanumeric product id", async () => {
      const res = await request(app).get("/api/v1/passport/1%3B%20DROP");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("should 404 for an unknown product id", async () => {
      const res = await request(app).get("/api/v1/passport/999999");
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/v1/portfolio/score", () => {
    test("should score a portfolio of valid products", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(3);
      expect(res.body.portfolio_summary).toHaveProperty("average_score");
      expect(res.body.portfolio_summary).toHaveProperty("highest");
      expect(res.body.portfolio_summary).toHaveProperty("lowest");
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
    });

    test("should skip unknown ids but score the rest", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "999999"] });
      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(1);
    });

    test("should reject when product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
    });

    test("should reject when product_ids is not an array", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: "1" });
      expect(res.status).toBe(400);
    });

    test("should reject more than 100 product_ids", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: ids });
      expect(res.status).toBe(400);
    });

    test("should 404 when no valid products are found", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["999999"] });
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/v1/audit/:productId", () => {
    test("should return an audit trail for a valid product", async () => {
      const res = await request(app).get("/api/v1/audit/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body).toHaveProperty("audit_entries");
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(res.body).toHaveProperty("total_entries");
    });

    test("should respect limit and offset", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=5&offset=0");
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("should reject a non-numeric limit", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=abc");
      expect(res.status).toBe(400);
    });

    test("should 404 for an unknown product id", async () => {
      const res = await request(app).get("/api/v1/audit/999999");
      expect(res.status).toBe(404);
    });
  });
});
