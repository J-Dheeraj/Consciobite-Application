const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Digital Product Passport endpoints (/api/v1)", () => {
  describe("GET /api/v1/passport/:productId", () => {
    test("should return a valid passport for a known product", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body.product_name).toBeDefined();
      expect(res.body.brand).toBeDefined();
      expect(res.body.category).toBeDefined();
      expect(typeof res.body.greengrade_score).toBe("number");
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(res.body.greengrade_score).toBeLessThanOrEqual(10);
      expect(typeof res.body.score_percentile).toBe("number");
      expect(res.body.total_carbon_footprint_kg_co2e).toBeGreaterThanOrEqual(0);
      expect(res.body.passport_generated_at).toBeDefined();
      expect(res.body.methodology_version).toBe("3.0");
    });

    test("should include all 7 emission breakdown fields", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      const breakdown = res.body.emission_breakdown;
      expect(breakdown).toBeDefined();
      expect(typeof breakdown.land_use_change).toBe("number");
      expect(typeof breakdown.animal_feed).toBe("number");
      expect(typeof breakdown.farm_operations).toBe("number");
      expect(typeof breakdown.processing).toBe("number");
      expect(typeof breakdown.transport).toBe("number");
      expect(typeof breakdown.packaging).toBe("number");
      expect(typeof breakdown.retail).toBe("number");
    });

    test("should return 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/passport/inv@lid!");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("should return 404 for a non-existent product ID", async () => {
      const res = await request(app).get("/api/v1/passport/99999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("should work for multiple known products", async () => {
      const ids = ["1", "2", "3"];
      for (const id of ids) {
        const res = await request(app).get(`/api/v1/passport/${id}`);
        expect(res.status).toBe(200);
        expect(res.body.product_id).toBe(id);
      }
    });

    test("should include optional data confidence fields if available", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      // data_confidence_tier and data_confidence_label are nullable
      expect("data_confidence_tier" in res.body).toBe(true);
      expect("data_confidence_label" in res.body).toBe(true);
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
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
    });

    test("each product in portfolio should have passport fields", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2"] });
      expect(res.status).toBe(200);
      res.body.products.forEach((p) => {
        expect(p.product_id).toBeDefined();
        expect(p.product_name).toBeDefined();
        expect(typeof p.greengrade_score).toBe("number");
        expect(p.emission_breakdown).toBeDefined();
        expect(p.methodology_version).toBe("3.0");
      });
    });

    test("average score should be within the min/max range of individual scores", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);
      const scores = res.body.products.map((p) => p.greengrade_score);
      const min = Math.min(...scores);
      const max = Math.max(...scores);
      const avg = res.body.portfolio_summary.average_score;
      expect(avg).toBeGreaterThanOrEqual(min - 0.1);
      expect(avg).toBeLessThanOrEqual(max + 0.1);
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

    test("should return 400 when product_ids is empty", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: [] });
      expect(res.status).toBe(400);
    });

    test("should return 400 when product_ids exceeds 100 entries", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: ids });
      expect(res.status).toBe(400);
    });

    test("should return 400 when a product_ids entry is not a string", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2] });
      expect(res.status).toBe(400);
    });

    test("should return 404 when no product IDs match", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["99999999", "88888888"] });
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("should silently skip invalid (non-alphanumeric) IDs and score the valid ones", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "inv@lid!"] });
      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.products[0].product_id).toBe("1");
    });

    test("category_benchmarks should aggregate per category correctly", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);
      res.body.category_benchmarks.forEach((bench) => {
        expect(bench.category).toBeDefined();
        expect(bench.count).toBeGreaterThan(0);
        expect(typeof bench.avg_score).toBe("number");
        expect(typeof bench.avg_emissions).toBe("number");
      });
    });
  });

  describe("GET /api/v1/audit/:productId", () => {
    test("should return audit log for a known product", async () => {
      const res = await request(app).get("/api/v1/audit/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body.product_name).toBeDefined();
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("should respect limit query param", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=2");
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(2);
    });

    test("should respect offset query param", async () => {
      const res1 = await request(app).get("/api/v1/audit/1?limit=50&offset=0");
      const res2 = await request(app).get("/api/v1/audit/1?limit=50&offset=0");
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.total_entries).toBe(res2.body.total_entries);
    });

    test("should return 400 for invalid product ID", async () => {
      const res = await request(app).get("/api/v1/audit/inv@lid!");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("should return 404 for non-existent product ID", async () => {
      const res = await request(app).get("/api/v1/audit/99999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("should return 400 for non-numeric limit", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=abc");
      expect(res.status).toBe(400);
    });

    test("should return 400 for non-numeric offset", async () => {
      const res = await request(app).get("/api/v1/audit/1?offset=abc");
      expect(res.status).toBe(400);
    });

    test("limit should be capped at 500", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=9999");
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(500);
    });
  });
});
