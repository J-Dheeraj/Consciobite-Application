const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

const VALID_ID = "1"; // Firm Tofu
const VALID_ID_2 = "2"; // Beef Ribeye Steak
const VALID_ID_3 = "3"; // Chicken Breast
const NONEXISTENT_ID = "99999";
const INVALID_ID = "invalid-id";

describe("Digital Product Passport API (/api/v1)", () => {
  describe("GET /api/v1/passport/:productId", () => {
    test("returns a valid passport for an existing product", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(typeof res.body.product_name).toBe("string");
      expect(typeof res.body.brand).toBe("string");
      expect(typeof res.body.category).toBe("string");
      expect(typeof res.body.greengrade_score).toBe("number");
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(res.body.greengrade_score).toBeLessThanOrEqual(10);
      expect(typeof res.body.score_percentile).toBe("number");
      expect(res.body.emission_breakdown).toBeDefined();
      expect(typeof res.body.emission_breakdown.land_use_change).toBe("number");
      expect(typeof res.body.emission_breakdown.animal_feed).toBe("number");
      expect(typeof res.body.emission_breakdown.farm_operations).toBe("number");
      expect(typeof res.body.emission_breakdown.processing).toBe("number");
      expect(typeof res.body.emission_breakdown.transport).toBe("number");
      expect(typeof res.body.emission_breakdown.packaging).toBe("number");
      expect(typeof res.body.emission_breakdown.retail).toBe("number");
      expect(typeof res.body.total_carbon_footprint_kg_co2e).toBe("number");
      expect(res.body.methodology_version).toBe("3.0");
      expect(typeof res.body.passport_generated_at).toBe("string");
    });

    test("returns 404 for a non-existent product ID", async () => {
      const res = await request(app).get(`/api/v1/passport/${NONEXISTENT_ID}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for an invalid product ID (contains hyphens)", async () => {
      const res = await request(app).get(`/api/v1/passport/${INVALID_ID}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for product ID with special characters", async () => {
      const res = await request(app).get("/api/v1/passport/1%3Bdrop");
      expect(res.status).toBe(400);
    });

    test("passport_generated_at is a valid ISO 8601 timestamp", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      const date = new Date(res.body.passport_generated_at);
      expect(date.toISOString()).toBe(res.body.passport_generated_at);
    });

    test("data_confidence_tier and label are present", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect("data_confidence_tier" in res.body).toBe(true);
      expect("data_confidence_label" in res.body).toBe(true);
    });
  });

  describe("POST /api/v1/portfolio/score", () => {
    test("returns portfolio summary for valid product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2, VALID_ID_3] });
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

    test("portfolio_summary average_score is within 0-10", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.average_score).toBeGreaterThanOrEqual(0);
      expect(res.body.portfolio_summary.average_score).toBeLessThanOrEqual(10);
    });

    test("returns 400 if product_ids is not an array", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: "1" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 if product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
    });

    test("returns 400 if product_ids has more than 100 items", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: ids });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/between 1 and 100/);
    });

    test("returns 400 if product_ids is empty", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: [] });
      expect(res.status).toBe(400);
    });

    test("returns 400 if a product_ids entry is not a string", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2, 3] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/string/);
    });

    test("returns 404 if all product IDs are non-existent", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["99998", "99999"] });
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("silently skips invalid IDs and returns results for valid ones", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, "invalid-id", NONEXISTENT_ID] });
      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.products[0].product_id).toBe(VALID_ID);
    });

    test("each product in response has required passport fields", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID] });
      expect(res.status).toBe(200);
      const p = res.body.products[0];
      expect(p.product_id).toBeDefined();
      expect(p.product_name).toBeDefined();
      expect(p.greengrade_score).toBeDefined();
      expect(p.emission_breakdown).toBeDefined();
      expect(p.total_carbon_footprint_kg_co2e).toBeDefined();
      expect(p.methodology_version).toBe("3.0");
    });

    test("category_benchmarks aggregate correctly for same-category products", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2, VALID_ID_3] });
      expect(res.status).toBe(200);
      res.body.category_benchmarks.forEach((b) => {
        expect(typeof b.category).toBe("string");
        expect(typeof b.count).toBe("number");
        expect(b.count).toBeGreaterThan(0);
        expect(typeof b.avg_score).toBe("number");
        expect(typeof b.avg_emissions).toBe("number");
      });
    });

    test("highest and lowest products reference items in the products array", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2, VALID_ID_3] });
      expect(res.status).toBe(200);
      const ids = res.body.products.map((p) => p.product_id);
      expect(ids).toContain(res.body.portfolio_summary.highest.id);
      expect(ids).toContain(res.body.portfolio_summary.lowest.id);
    });
  });

  describe("GET /api/v1/audit/:productId", () => {
    test("returns audit log for an existing product", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(typeof res.body.product_name).toBe("string");
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("returns 404 for a non-existent product ID", async () => {
      const res = await request(app).get(`/api/v1/audit/${NONEXISTENT_ID}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for an invalid product ID", async () => {
      const res = await request(app).get(`/api/v1/audit/${INVALID_ID}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("respects the limit query parameter", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=5`);
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("respects the offset query parameter", async () => {
      const res1 = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=10&offset=0`);
      const res2 = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=10&offset=1000`);
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res2.body.total_entries).toBe(res1.body.total_entries);
    });

    test("returns 400 for a non-numeric limit", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=abc`);
      expect(res.status).toBe(400);
    });

    test("returns 400 for a non-numeric offset", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?offset=xyz`);
      expect(res.status).toBe(400);
    });

    test("caps limit at 500", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=9999`);
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(500);
    });
  });
});
