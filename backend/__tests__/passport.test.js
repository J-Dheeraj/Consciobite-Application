process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../src/index");

describe("Digital Product Passport API (/api/v1)", () => {
  describe("GET /api/v1/passport/:productId", () => {
    test("should return a valid passport for product 1", async () => {
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
      expect(res.body.score_percentile).toBeGreaterThanOrEqual(0);
      expect(res.body.score_percentile).toBeLessThanOrEqual(100);
    });

    test("should return correct emission_breakdown keys", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      const eb = res.body.emission_breakdown;
      expect(eb).toHaveProperty("land_use_change");
      expect(eb).toHaveProperty("animal_feed");
      expect(eb).toHaveProperty("farm_operations");
      expect(eb).toHaveProperty("processing");
      expect(eb).toHaveProperty("transport");
      expect(eb).toHaveProperty("packaging");
      expect(eb).toHaveProperty("retail");
      expect(typeof eb.land_use_change).toBe("number");
    });

    test("should include total_carbon_footprint_kg_co2e", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      expect(typeof res.body.total_carbon_footprint_kg_co2e).toBe("number");
      expect(res.body.total_carbon_footprint_kg_co2e).toBeGreaterThan(0);
    });

    test("should include methodology_version and passport_generated_at", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      expect(res.body.methodology_version).toBe("3.0");
      expect(typeof res.body.passport_generated_at).toBe("string");
      expect(new Date(res.body.passport_generated_at).getTime()).not.toBeNaN();
    });

    test("should return 400 for non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/passport/inv@lid!");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("should return 400 for product ID with special chars", async () => {
      const res = await request(app).get("/api/v1/passport/1-2-3");
      expect(res.status).toBe(400);
    });

    test("should return 404 for non-existent numeric product ID", async () => {
      const res = await request(app).get("/api/v1/passport/99999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("should work for product 2 (different category)", async () => {
      const res = await request(app).get("/api/v1/passport/2");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("2");
    });
  });

  describe("POST /api/v1/portfolio/score", () => {
    test("should return portfolio summary for valid product IDs", async () => {
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

    test("should return category_benchmarks grouped by category", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
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
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: "1,2,3" });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/array/i);
    });

    test("should return 400 for empty product_ids array", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: [] });
      expect(res.status).toBe(400);
    });

    test("should return 400 for array with more than 100 items", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: ids });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/100/);
    });

    test("should return 400 when any ID is not a string", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2, 3] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/string/i);
    });

    test("should return 404 when no valid products found", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["99999998", "99999999"] });
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("should silently skip invalid/non-existent IDs in a mixed list", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "99999999", "inv@lid"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(1);
      expect(res.body.products[0].product_id).toBe("1");
    });

    test("highest and lowest should be same product for single-item portfolio", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.highest.id).toBe(res.body.portfolio_summary.lowest.id);
    });
  });

  describe("GET /api/v1/audit/:productId", () => {
    test("should return audit log for a valid product", async () => {
      const res = await request(app).get("/api/v1/audit/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(typeof res.body.product_name).toBe("string");
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("should return 400 for non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/bad@id");
      expect(res.status).toBe(400);
    });

    test("should return 404 for non-existent product", async () => {
      const res = await request(app).get("/api/v1/audit/99999999");
      expect(res.status).toBe(404);
    });

    test("should respect limit query param", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=5");
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

    test("should accept valid limit and offset", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=10&offset=0");
      expect(res.status).toBe(200);
    });
  });
});
