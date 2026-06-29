const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");
const products = require("../src/data/products.json");

describe("Digital Product Passport API", () => {
  const productId = String(products[0].id);

  describe("GET /api/v1/passport/:productId", () => {
    test("should return a passport for a valid product", async () => {
      const res = await request(app).get(`/api/v1/passport/${productId}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(productId);
      expect(res.body).toHaveProperty("greengrade_score");
      expect(res.body).toHaveProperty("emission_breakdown");
      expect(res.body.emission_breakdown).toHaveProperty("land_use_change");
      expect(res.body).toHaveProperty("total_carbon_footprint_kg_co2e");
      expect(res.body.methodology_version).toBe("3.0");
    });

    test("should return 404 for unknown product", async () => {
      const res = await request(app).get("/api/v1/passport/999999");
      expect(res.status).toBe(404);
    });

    test("should reject non-alphanumeric product id", async () => {
      const res = await request(app).get("/api/v1/passport/abc%20123");
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v1/portfolio/score", () => {
    test("should return passports and a portfolio summary", async () => {
      const ids = products.slice(0, 3).map((p) => String(p.id));
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: ids });
      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(3);
      expect(res.body.portfolio_summary).toHaveProperty("average_score");
      expect(res.body.portfolio_summary).toHaveProperty("highest");
      expect(res.body.portfolio_summary).toHaveProperty("lowest");
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
    });

    test("should skip unknown ids and still return matched products", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [productId, "999999"] });
      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(1);
    });

    test("should reject missing product_ids", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
    });

    test("should reject a product_ids payload that is not an array", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: "not-an-array" });
      expect(res.status).toBe(400);
    });

    test("should reject more than 100 product_ids", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i));
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: ids });
      expect(res.status).toBe(400);
    });

    test("should return 404 when no ids match any product", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["999999", "999998"] });
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/v1/audit/:productId", () => {
    test("should return audit entries for a valid product", async () => {
      const res = await request(app).get(`/api/v1/audit/${productId}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(productId);
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(res.body).toHaveProperty("total_entries");
    });

    test("should respect limit and offset", async () => {
      const res = await request(app).get(`/api/v1/audit/${productId}?limit=1&offset=0`);
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(1);
    });

    test("should reject a non-numeric limit", async () => {
      const res = await request(app).get(`/api/v1/audit/${productId}?limit=abc`);
      expect(res.status).toBe(400);
    });

    test("should return 404 for unknown product", async () => {
      const res = await request(app).get("/api/v1/audit/999999");
      expect(res.status).toBe(404);
    });
  });
});
