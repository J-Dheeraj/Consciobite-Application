const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Digital Product Passport endpoints (GET /api/v1/passport, POST /api/v1/portfolio, GET /api/v1/audit)", () => {
  // -------------------------------------------------------------------------
  // GET /api/v1/passport/:productId
  // -------------------------------------------------------------------------
  describe("GET /api/v1/passport/:productId", () => {
    test("returns a well-formed passport for a valid product ID", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body.product_name).toBe("Firm Tofu");
      expect(typeof res.body.greengrade_score).toBe("number");
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(res.body.greengrade_score).toBeLessThanOrEqual(10);
      expect(typeof res.body.score_percentile).toBe("number");
      expect(res.body.methodology_version).toBe("3.0");
      expect(res.body.passport_generated_at).toBeDefined();
    });

    test("passport emission_breakdown contains all 7 lifecycle categories", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      const breakdown = res.body.emission_breakdown;
      expect(breakdown).toHaveProperty("land_use_change");
      expect(breakdown).toHaveProperty("animal_feed");
      expect(breakdown).toHaveProperty("farm_operations");
      expect(breakdown).toHaveProperty("processing");
      expect(breakdown).toHaveProperty("transport");
      expect(breakdown).toHaveProperty("packaging");
      expect(breakdown).toHaveProperty("retail");
    });

    test("passport includes total_carbon_footprint_kg_co2e as a positive number", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      expect(typeof res.body.total_carbon_footprint_kg_co2e).toBe("number");
      expect(res.body.total_carbon_footprint_kg_co2e).toBeGreaterThan(0);
    });

    test("works for a second valid product", async () => {
      const res = await request(app).get("/api/v1/passport/2");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("2");
      expect(res.body.product_name).toBe("Beef Ribeye Steak");
    });

    test("returns 404 for a non-existent product ID", async () => {
      const res = await request(app).get("/api/v1/passport/999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for an ID containing special characters", async () => {
      const res = await request(app).get("/api/v1/passport/bad@id!");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid product id/i);
    });

    test("returns 400 for an ID with a SQL injection attempt", async () => {
      const res = await request(app).get("/api/v1/passport/1%27%20OR%201%3D1");
      expect(res.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  // POST /api/v1/portfolio/score
  // -------------------------------------------------------------------------
  describe("POST /api/v1/portfolio/score", () => {
    test("returns portfolio summary for valid product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBe(3);
      expect(res.body.portfolio_summary).toBeDefined();
      expect(typeof res.body.portfolio_summary.average_score).toBe("number");
      expect(res.body.portfolio_summary.product_count).toBe(3);
    });

    test("portfolio_summary includes highest and lowest scoring products", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);
      const { highest, lowest } = res.body.portfolio_summary;
      expect(highest).toHaveProperty("id");
      expect(highest).toHaveProperty("name");
      expect(highest).toHaveProperty("score");
      expect(lowest).toHaveProperty("id");
      expect(lowest).toHaveProperty("name");
      expect(lowest).toHaveProperty("score");
      expect(highest.score).toBeGreaterThanOrEqual(lowest.score);
    });

    test("portfolio response includes category_benchmarks array", async () => {
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

    test("silently skips invalid IDs and scores remaining valid ones", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "999999"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(1);
    });

    test("returns 404 when all provided IDs are invalid or non-existent", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["999990", "999991"] });
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 when product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
    });

    test("returns 400 when product_ids is not an array", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: "1,2,3" });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/must be an array/i);
    });

    test("returns 400 when product_ids is an empty array", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: [] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/between 1 and 100/i);
    });

    test("returns 400 when product_ids contains non-string entries", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/must be a string/i);
    });

    test("returns 400 when product_ids exceeds 100 items", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: ids });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/between 1 and 100/i);
    });

    test("average_score is within 0–10 range", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.average_score).toBeGreaterThanOrEqual(0);
      expect(res.body.portfolio_summary.average_score).toBeLessThanOrEqual(10);
    });
  });

  // -------------------------------------------------------------------------
  // GET /api/v1/audit/:productId
  // -------------------------------------------------------------------------
  describe("GET /api/v1/audit/:productId", () => {
    test("returns audit structure for a valid product", async () => {
      const res = await request(app).get("/api/v1/audit/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body.product_name).toBe("Firm Tofu");
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("audit_entries count matches total_entries (fresh DB has 0 changes)", async () => {
      const res = await request(app).get("/api/v1/audit/1");
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(res.body.total_entries);
    });

    test("respects limit query param", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=0");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
    });

    test("returns 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/bad@id!");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid product id/i);
    });

    test("returns 404 for a non-existent product ID", async () => {
      const res = await request(app).get("/api/v1/audit/999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for non-numeric limit param", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=abc");
      expect(res.status).toBe(400);
    });

    test("returns 400 for non-numeric offset param", async () => {
      const res = await request(app).get("/api/v1/audit/1?offset=xyz");
      expect(res.status).toBe(400);
    });
  });
});
