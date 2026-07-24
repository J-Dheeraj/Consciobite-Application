const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Passport API endpoints", () => {
  // Use product IDs known to exist in products.json
  const VALID_ID_1 = "1"; // Firm Tofu Protein
  const VALID_ID_2 = "14"; // Atlantic Salmon Fillet Seafood

  describe("GET /api/v1/passport/:productId", () => {
    test("should return a full passport for a valid product", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID_1}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID_1);
    });

    test("passport should include all required top-level fields", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID_1}`);
      expect(res.status).toBe(200);
      const p = res.body;
      expect(p).toHaveProperty("product_id");
      expect(p).toHaveProperty("product_name");
      expect(p).toHaveProperty("brand");
      expect(p).toHaveProperty("category");
      expect(p).toHaveProperty("greengrade_score");
      expect(p).toHaveProperty("score_percentile");
      expect(p).toHaveProperty("emission_breakdown");
      expect(p).toHaveProperty("total_carbon_footprint_kg_co2e");
      expect(p).toHaveProperty("passport_generated_at");
      expect(p).toHaveProperty("methodology_version");
    });

    test("emission_breakdown should contain all 7 supply-chain dimensions", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID_1}`);
      expect(res.status).toBe(200);
      const eb = res.body.emission_breakdown;
      expect(eb).toHaveProperty("land_use_change");
      expect(eb).toHaveProperty("animal_feed");
      expect(eb).toHaveProperty("farm_operations");
      expect(eb).toHaveProperty("processing");
      expect(eb).toHaveProperty("transport");
      expect(eb).toHaveProperty("packaging");
      expect(eb).toHaveProperty("retail");
    });

    test("greengrade_score should be a number between 0 and 10", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID_1}`);
      expect(res.status).toBe(200);
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(res.body.greengrade_score).toBeLessThanOrEqual(10);
    });

    test("methodology_version should be '3.0'", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID_1}`);
      expect(res.status).toBe(200);
      expect(res.body.methodology_version).toBe("3.0");
    });

    test("passport_generated_at should be a valid ISO date string", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID_1}`);
      expect(res.status).toBe(200);
      expect(new Date(res.body.passport_generated_at).toISOString()).toBe(
        res.body.passport_generated_at
      );
    });

    test("should return 400 for an ID with special characters", async () => {
      const res = await request(app).get("/api/v1/passport/inv@lid!");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("should return 404 for a non-existent product ID", async () => {
      const res = await request(app).get("/api/v1/passport/99999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("should work for a second valid product", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID_2}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID_2);
    });
  });

  describe("POST /api/v1/portfolio/score", () => {
    test("should return portfolio summary for valid product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID_1, VALID_ID_2] });
      expect(res.status).toBe(200);
      expect(res.body.products).toBeDefined();
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.portfolio_summary).toBeDefined();
      expect(res.body.category_benchmarks).toBeDefined();
    });

    test("portfolio_summary should contain average_score, product_count, highest, and lowest", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID_1, VALID_ID_2] });
      expect(res.status).toBe(200);
      const s = res.body.portfolio_summary;
      expect(s).toHaveProperty("average_score");
      expect(s).toHaveProperty("product_count");
      expect(s).toHaveProperty("highest");
      expect(s).toHaveProperty("lowest");
      expect(s.product_count).toBe(2);
    });

    test("product_count should match the number of valid products returned", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID_1, VALID_ID_2] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(res.body.products.length);
    });

    test("average_score should equal average of individual scores", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID_1, VALID_ID_2] });
      expect(res.status).toBe(200);
      const scores = res.body.products.map((p) => p.greengrade_score);
      const expectedAvg = Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10;
      expect(res.body.portfolio_summary.average_score).toBe(expectedAvg);
    });

    test("highest/lowest should reference the correct products", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID_1, VALID_ID_2] });
      expect(res.status).toBe(200);
      const scores = res.body.products.map((p) => p.greengrade_score);
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);
      expect(res.body.portfolio_summary.highest.score).toBe(maxScore);
      expect(res.body.portfolio_summary.lowest.score).toBe(minScore);
    });

    test("category_benchmarks should list each category with count and avg_score", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID_1, VALID_ID_2] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
      res.body.category_benchmarks.forEach((b) => {
        expect(b).toHaveProperty("category");
        expect(b).toHaveProperty("count");
        expect(b).toHaveProperty("avg_score");
        expect(b).toHaveProperty("avg_emissions");
      });
    });

    test("should skip invalid IDs and still return valid products", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID_1, "inv@lid", "99999999"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(1);
    });

    test("should return 404 when all product IDs are invalid/not-found", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["99999998", "99999997"] });
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
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

    test("should return 400 for an empty array", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: [] });
      expect(res.status).toBe(400);
    });

    test("should return 400 when a product_ids entry is not a string", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/string/i);
    });

    test("should return 400 for more than 100 product IDs", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: ids });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/audit/:productId", () => {
    test("should return audit log structure for a valid product", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID_1}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID_1);
      expect(res.body.product_name).toBeDefined();
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("total_entries should be a non-negative integer", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID_1}`);
      expect(res.status).toBe(200);
      expect(res.body.total_entries).toBeGreaterThanOrEqual(0);
    });

    test("should accept valid limit query param", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID_1}?limit=10`);
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(10);
    });

    test("should accept valid offset query param", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID_1}?offset=0`);
      expect(res.status).toBe(200);
    });

    test("should return 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/inv@lid!");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("should return 404 for a non-existent product", async () => {
      const res = await request(app).get("/api/v1/audit/99999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("should return 400 for a non-numeric limit", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID_1}?limit=abc`);
      expect(res.status).toBe(400);
    });

    test("should return 400 for a non-numeric offset", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID_1}?offset=abc`);
      expect(res.status).toBe(400);
    });
  });
});
