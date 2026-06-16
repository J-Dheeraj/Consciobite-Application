const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Digital Product Passport endpoints (/api/v1)", () => {
  const VALID_ID = "1"; // Firm Tofu
  const VALID_ID_2 = "2"; // Beef Ribeye Steak
  const VALID_ID_3 = "3"; // Chicken Breast

  describe("GET /api/v1/passport/:productId", () => {
    test("returns a well-formed passport for a valid product", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(res.body.product_name).toBeDefined();
      expect(res.body.brand).toBeDefined();
      expect(res.body.category).toBeDefined();
      expect(typeof res.body.greengrade_score).toBe("number");
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(res.body.greengrade_score).toBeLessThanOrEqual(10);
      expect(typeof res.body.score_percentile).toBe("number");
      expect(res.body.emission_breakdown).toBeDefined();
      expect(Object.keys(res.body.emission_breakdown)).toEqual([
        "land_use_change",
        "animal_feed",
        "farm_operations",
        "processing",
        "transport",
        "packaging",
        "retail",
      ]);
      expect(typeof res.body.total_carbon_footprint_kg_co2e).toBe("number");
      expect(res.body.methodology_version).toBe("3.0");
      expect(res.body.passport_generated_at).toBeDefined();
    });

    test("returns 404 for an unknown product", async () => {
      const res = await request(app).get("/api/v1/passport/99999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/passport/bad-id!");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
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

    test("silently skips invalid IDs and scores remaining valid ones", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, "99999999"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(1);
    });

    test("returns 404 when no valid products are found", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["99999999", "88888888"] });
      expect(res.status).toBe(404);
    });

    test("returns 400 when product_ids is not an array", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: "1" });
      expect(res.status).toBe(400);
    });

    test("returns 400 when product_ids is empty", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: [] });
      expect(res.status).toBe(400);
    });

    test("returns 400 when product_ids exceeds 100 items", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: ids });
      expect(res.status).toBe(400);
    });

    test("returns 400 when product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
    });

    test("portfolio average_score is within valid range", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.average_score).toBeGreaterThanOrEqual(0);
      expect(res.body.portfolio_summary.average_score).toBeLessThanOrEqual(10);
    });
  });

  describe("GET /api/v1/audit/:productId", () => {
    test("returns audit entries for a valid product", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(res.body.product_name).toBeDefined();
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("returns 404 for an unknown product", async () => {
      const res = await request(app).get("/api/v1/audit/99999999");
      expect(res.status).toBe(404);
    });

    test("returns 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/bad-id!");
      expect(res.status).toBe(400);
    });

    test("respects limit query parameter", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=5`);
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("returns 400 for non-numeric limit", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=abc`);
      expect(res.status).toBe(400);
    });

    test("returns 400 for non-numeric offset", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?offset=abc`);
      expect(res.status).toBe(400);
    });
  });
});
