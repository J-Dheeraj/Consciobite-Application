const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Digital Product Passport API (/api/v1)", () => {
  describe("GET /api/v1/passport/:productId", () => {
    test("returns a valid passport for a known product", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body.product_name).toBeTruthy();
      expect(res.body.category).toBeTruthy();
      expect(typeof res.body.greengrade_score).toBe("number");
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(res.body.greengrade_score).toBeLessThanOrEqual(10);
      expect(typeof res.body.score_percentile).toBe("number");
      expect(typeof res.body.total_carbon_footprint_kg_co2e).toBe("number");
      expect(res.body.methodology_version).toBe("3.0");
      expect(res.body.passport_generated_at).toBeTruthy();
    });

    test("emission_breakdown has all 7 supply chain categories", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      const { emission_breakdown } = res.body;
      expect(emission_breakdown).toBeDefined();
      const keys = [
        "land_use_change",
        "animal_feed",
        "farm_operations",
        "processing",
        "transport",
        "packaging",
        "retail",
      ];
      keys.forEach((k) => expect(typeof emission_breakdown[k]).toBe("number"));
    });

    test("returns 400 for non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/passport/inv@lid!");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeTruthy();
    });

    test("returns 404 for non-existent numeric product ID", async () => {
      const res = await request(app).get("/api/v1/passport/99999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });

    test("returns passport for a second known product", async () => {
      const res = await request(app).get("/api/v1/passport/2");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("2");
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
    });
  });

  describe("POST /api/v1/portfolio/score", () => {
    test("returns portfolio summary for valid product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2"] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products).toHaveLength(2);
      expect(res.body.portfolio_summary).toBeDefined();
      expect(typeof res.body.portfolio_summary.average_score).toBe("number");
      expect(res.body.portfolio_summary.product_count).toBe(2);
      expect(res.body.portfolio_summary.highest).toBeDefined();
      expect(res.body.portfolio_summary.lowest).toBeDefined();
    });

    test("category_benchmarks is included and has correct shape", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2"] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
      res.body.category_benchmarks.forEach((b) => {
        expect(b.category).toBeTruthy();
        expect(typeof b.count).toBe("number");
        expect(typeof b.avg_score).toBe("number");
        expect(typeof b.avg_emissions).toBe("number");
      });
    });

    test("silently skips unknown product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "99999999"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(1);
    });

    test("returns 404 when all product IDs are invalid", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["99999991", "99999992"] });
      expect(res.status).toBe(404);
      expect(res.body.error).toBeTruthy();
    });

    test("returns 400 when product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
    });

    test("returns 400 when product_ids is not an array", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: "1,2,3" });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/array/i);
    });

    test("returns 400 when product_ids contains non-string entries", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/string/i);
    });

    test("returns 400 when product_ids is empty", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: [] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/between 1 and 100/i);
    });

    test("returns 400 when product_ids exceeds 100 items", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: ids });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/between 1 and 100/i);
    });

    test("portfolio_summary highest/lowest are correct for two products", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2"] });
      expect(res.status).toBe(200);
      const { highest, lowest } = res.body.portfolio_summary;
      expect(highest.score).toBeGreaterThanOrEqual(lowest.score);
    });
  });

  describe("GET /api/v1/audit/:productId", () => {
    test("returns audit entries for a known product", async () => {
      const res = await request(app).get("/api/v1/audit/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body.product_name).toBeTruthy();
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("respects limit query parameter", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=2");
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(2);
    });

    test("returns 400 for invalid limit query parameter", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=abc");
      expect(res.status).toBe(400);
    });

    test("returns 400 for invalid offset query parameter", async () => {
      const res = await request(app).get("/api/v1/audit/1?offset=xyz");
      expect(res.status).toBe(400);
    });

    test("returns 400 for non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/bad-id!");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeTruthy();
    });

    test("returns 404 for non-existent product ID", async () => {
      const res = await request(app).get("/api/v1/audit/99999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });
  });
});
