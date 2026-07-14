const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Digital Product Passport endpoints", () => {
  // ------------------------------------------------------------------ //
  //  GET /api/v1/passport/:productId
  // ------------------------------------------------------------------ //
  describe("GET /api/v1/passport/:productId", () => {
    test("should return a valid passport for an existing product", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body.product_name).toBe("Firm Tofu");
      expect(typeof res.body.greengrade_score).toBe("number");
      expect(typeof res.body.score_percentile).toBe("number");
      expect(typeof res.body.total_carbon_footprint_kg_co2e).toBe("number");
      expect(res.body.methodology_version).toBe("3.0");
      expect(res.body.passport_generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test("should include all 7 emission breakdown categories", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      const bd = res.body.emission_breakdown;
      expect(bd).toBeDefined();
      expect(typeof bd.land_use_change).toBe("number");
      expect(typeof bd.animal_feed).toBe("number");
      expect(typeof bd.farm_operations).toBe("number");
      expect(typeof bd.processing).toBe("number");
      expect(typeof bd.transport).toBe("number");
      expect(typeof bd.packaging).toBe("number");
      expect(typeof bd.retail).toBe("number");
    });

    test("should include category and brand fields", async () => {
      const res = await request(app).get("/api/v1/passport/2");
      expect(res.status).toBe(200);
      expect(res.body.category).toBeDefined();
      expect(res.body.brand).toBeDefined();
    });

    test("should return 404 for an unknown product ID", async () => {
      const res = await request(app).get("/api/v1/passport/99999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("should return 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/passport/bad-id!");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("should expose passport at v1 alias", async () => {
      const res = await request(app).get("/api/v1/passport/3");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("3");
    });
  });

  // ------------------------------------------------------------------ //
  //  POST /api/v1/portfolio/score
  // ------------------------------------------------------------------ //
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
    });

    test("portfolio_summary should include highest and lowest scoring products", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);
      const summary = res.body.portfolio_summary;
      expect(summary.highest).toBeDefined();
      expect(summary.highest.id).toBeDefined();
      expect(typeof summary.highest.score).toBe("number");
      expect(summary.lowest).toBeDefined();
      expect(typeof summary.lowest.score).toBe("number");
      expect(summary.highest.score).toBeGreaterThanOrEqual(summary.lowest.score);
    });

    test("should return category_benchmarks", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2"] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
      const bench = res.body.category_benchmarks[0];
      expect(bench.category).toBeDefined();
      expect(typeof bench.count).toBe("number");
      expect(typeof bench.avg_score).toBe("number");
      expect(typeof bench.avg_emissions).toBe("number");
    });

    test("should silently skip invalid product IDs and return remaining", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "99999"] });
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBe(1);
    });

    test("should return 404 when no valid products are found", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["99998", "99999"] });
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("should return 400 when product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
    });

    test("should return 400 when product_ids is not an array", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: "1" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("should return 400 when product_ids contains non-string entries", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2, 3] });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("should return 400 for an empty product_ids array", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: [] });
      expect(res.status).toBe(400);
    });

    test("should accept a single product ID", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(1);
      expect(res.body.portfolio_summary.highest.id).toBe(res.body.portfolio_summary.lowest.id);
    });
  });

  // ------------------------------------------------------------------ //
  //  GET /api/v1/audit/:productId
  // ------------------------------------------------------------------ //
  describe("GET /api/v1/audit/:productId", () => {
    test("should return audit history structure for a valid product", async () => {
      const res = await request(app).get("/api/v1/audit/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body.product_name).toBeDefined();
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("should return 404 for an unknown product ID", async () => {
      const res = await request(app).get("/api/v1/audit/99999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("should return 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/bad-id!");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("should respect the limit query parameter", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=5");
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("should reject a non-integer limit", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=abc");
      expect(res.status).toBe(400);
    });

    test("should reject a non-integer offset", async () => {
      const res = await request(app).get("/api/v1/audit/1?offset=xyz");
      expect(res.status).toBe(400);
    });

    test("should return empty audit_entries for a fresh product with no changes", async () => {
      const res = await request(app).get("/api/v1/audit/1");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
    });
  });
});
