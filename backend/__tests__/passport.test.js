const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

const VALID_ID = "1"; // Firm Tofu Protein

describe("Digital Product Passport endpoints (GET /api/v1)", () => {
  describe("GET /api/v1/passport/:productId", () => {
    test("returns a passport for a valid product ID", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(typeof res.body.product_name).toBe("string");
      expect(typeof res.body.greengrade_score).toBe("number");
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(res.body.greengrade_score).toBeLessThanOrEqual(10);
    });

    test("passport includes emission_breakdown with 7 keys", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
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

    test("passport includes total_carbon_footprint_kg_co2e", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(typeof res.body.total_carbon_footprint_kg_co2e).toBe("number");
      expect(res.body.total_carbon_footprint_kg_co2e).toBeGreaterThanOrEqual(0);
    });

    test("passport includes methodology_version and passport_generated_at", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.methodology_version).toBe("3.0");
      expect(typeof res.body.passport_generated_at).toBe("string");
      expect(new Date(res.body.passport_generated_at).getTime()).not.toBeNaN();
    });

    test("returns 404 for a non-existent product ID", async () => {
      const res = await request(app).get("/api/v1/passport/99999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for an invalid (non-alphanumeric) product ID", async () => {
      const res = await request(app).get("/api/v1/passport/bad-id!");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe("POST /api/v1/portfolio/score", () => {
    test("returns portfolio summary for valid product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, "2", "3"] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBeGreaterThan(0);
      expect(res.body.portfolio_summary).toBeDefined();
      expect(typeof res.body.portfolio_summary.average_score).toBe("number");
      expect(typeof res.body.portfolio_summary.product_count).toBe("number");
      expect(res.body.portfolio_summary.highest).toBeDefined();
      expect(res.body.portfolio_summary.lowest).toBeDefined();
    });

    test("returns category_benchmarks in portfolio response", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, "2"] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
      if (res.body.category_benchmarks.length > 0) {
        const bench = res.body.category_benchmarks[0];
        expect(typeof bench.category).toBe("string");
        expect(typeof bench.count).toBe("number");
        expect(typeof bench.avg_score).toBe("number");
      }
    });

    test("returns 400 when product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
    });

    test("returns 400 when product_ids is not an array", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: VALID_ID });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/array/i);
    });

    test("returns 400 when product_ids is empty array", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [] });
      expect(res.status).toBe(400);
    });

    test("returns 400 when product_ids contains more than 100 items", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ids });
      expect(res.status).toBe(400);
    });

    test("returns 400 when product_ids contains non-string entries", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/string/i);
    });

    test("returns 404 when all product IDs are invalid or unknown", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["99999", "88888"] });
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("silently skips invalid IDs and scores valid ones", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, "99999"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(1);
    });
  });

  describe("GET /api/v1/audit/:productId", () => {
    test("returns audit entries for a valid product", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(typeof res.body.product_name).toBe("string");
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("respects limit query param", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=1`);
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(1);
    });

    test("returns 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/bad-id!");
      expect(res.status).toBe(400);
    });

    test("returns 404 for an unknown product ID", async () => {
      const res = await request(app).get("/api/v1/audit/99999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for non-numeric limit param", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=abc`);
      expect(res.status).toBe(400);
    });
  });
});
