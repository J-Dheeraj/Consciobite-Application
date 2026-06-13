const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Digital Product Passport API (/api/v1)", () => {
  describe("GET /api/v1/passport/:productId", () => {
    test("should return a passport for a valid product", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body.product_name).toBe("Firm Tofu");
      expect(res.body).toHaveProperty("greengrade_score");
      expect(res.body).toHaveProperty("emission_breakdown");
      expect(res.body).toHaveProperty("total_carbon_footprint_kg_co2e");
      expect(res.body).toHaveProperty("passport_generated_at");
      expect(res.body.methodology_version).toBe("3.0");
    });

    test("emission_breakdown should contain all 7 dimensions", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      const dims = [
        "land_use_change",
        "animal_feed",
        "farm_operations",
        "processing",
        "transport",
        "packaging",
        "retail",
      ];
      dims.forEach((dim) => {
        expect(res.body.emission_breakdown).toHaveProperty(dim);
        expect(typeof res.body.emission_breakdown[dim]).toBe("number");
      });
    });

    test("should return a valid score_percentile", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      expect(typeof res.body.score_percentile).toBe("number");
      expect(res.body.score_percentile).toBeGreaterThanOrEqual(0);
      expect(res.body.score_percentile).toBeLessThanOrEqual(100);
    });

    test("should return 404 for a non-existent product", async () => {
      const res = await request(app).get("/api/v1/passport/99999");
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error");
    });

    test("should return 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/passport/bad-id!");
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    test("should work for another valid product", async () => {
      const res = await request(app).get("/api/v1/passport/2");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("2");
      expect(res.body.product_name).toBe("Beef Ribeye Steak");
    });
  });

  describe("POST /api/v1/portfolio/score", () => {
    test("should score a valid array of product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBe(3);
      expect(res.body).toHaveProperty("portfolio_summary");
      expect(res.body).toHaveProperty("category_benchmarks");
    });

    test("portfolio_summary should have correct structure", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);
      const s = res.body.portfolio_summary;
      expect(typeof s.average_score).toBe("number");
      expect(s.product_count).toBe(3);
      expect(s.highest).toHaveProperty("id");
      expect(s.highest).toHaveProperty("name");
      expect(s.highest).toHaveProperty("score");
      expect(s.lowest).toHaveProperty("id");
    });

    test("should silently skip unknown product IDs and score valid ones", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "99999"] });
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBe(1);
      expect(res.body.portfolio_summary.product_count).toBe(1);
    });

    test("should return 404 when all IDs are unknown", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["99998", "99999"] });
      expect(res.status).toBe(404);
    });

    test("should return 400 when product_ids is not an array", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: "1" });
      expect(res.status).toBe(400);
    });

    test("should return 400 for empty array", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: [] });
      expect(res.status).toBe(400);
    });

    test("should return 400 when array exceeds 100 items", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: ids });
      expect(res.status).toBe(400);
    });

    test("should return 400 when product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
    });

    test("should return 400 when an entry is not a string", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2] });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/audit/:productId", () => {
    test("should return audit entries for a valid product", async () => {
      const res = await request(app).get("/api/v1/audit/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body).toHaveProperty("product_name");
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("should respect the limit query parameter", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=5");
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("should return 400 for non-integer limit", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=abc");
      expect(res.status).toBe(400);
    });

    test("should return 404 for a non-existent product", async () => {
      const res = await request(app).get("/api/v1/audit/99999");
      expect(res.status).toBe(404);
    });

    test("should return 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/bad-id!");
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/transparency/stats", () => {
    test("should return transparency statistics", async () => {
      const res = await request(app).get("/api/transparency/stats");
      expect(res.status).toBe(200);
      expect(typeof res.body.productCount).toBe("number");
      expect(res.body.productCount).toBe(550);
      expect(res.body).toHaveProperty("totalChanges");
      expect(res.body).toHaveProperty("paying");
      expect(res.body).toHaveProperty("nonPaying");
    });

    test("paying and nonPaying should have count and avgDelta", async () => {
      const res = await request(app).get("/api/transparency/stats");
      expect(res.status).toBe(200);
      expect(typeof res.body.paying.count).toBe("number");
      expect(typeof res.body.paying.avgDelta).toBe("number");
      expect(typeof res.body.nonPaying.count).toBe("number");
      expect(typeof res.body.nonPaying.avgDelta).toBe("number");
    });

    test("should include manufacturer counts", async () => {
      const res = await request(app).get("/api/transparency/stats");
      expect(res.status).toBe(200);
      expect(typeof res.body.manufacturerCount).toBe("number");
      expect(typeof res.body.payingCount).toBe("number");
    });
  });
});
