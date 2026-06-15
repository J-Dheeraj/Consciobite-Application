const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Digital Product Passport endpoints (/api/v1)", () => {
  // Product IDs 1, 2, 3 are the first entries in products.json
  const VALID_ID = "1";
  const VALID_ID_2 = "2";
  const VALID_ID_3 = "3";

  // ─── GET /api/v1/passport/:productId ──────────────────────────────────────

  describe("GET /api/v1/passport/:productId", () => {
    test("returns a well-formed passport for a valid product", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);

      const p = res.body;
      expect(p.product_id).toBe(VALID_ID);
      expect(typeof p.product_name).toBe("string");
      expect(typeof p.brand).toBe("string");
      expect(typeof p.category).toBe("string");
      expect(typeof p.greengrade_score).toBe("number");
      expect(p.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(p.greengrade_score).toBeLessThanOrEqual(10);
      expect(typeof p.score_percentile).toBe("number");
      expect(p.total_carbon_footprint_kg_co2e).toBeGreaterThanOrEqual(0);
      expect(p.methodology_version).toBe("3.0");
      expect(typeof p.passport_generated_at).toBe("string");
    });

    test("passport emission_breakdown has all 7 supply chain categories", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
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

    test("returns 400 for non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/passport/bad-id!");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for ID with special characters", async () => {
      const res = await request(app).get("/api/v1/passport/id%20with%20spaces");
      expect(res.status).toBe(400);
    });

    test("returns 404 for a valid-format but non-existent product ID", async () => {
      const res = await request(app).get("/api/v1/passport/999999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("passport_generated_at is a valid ISO timestamp", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      const ts = new Date(res.body.passport_generated_at);
      expect(isNaN(ts.getTime())).toBe(false);
    });
  });

  // ─── POST /api/v1/portfolio/score ─────────────────────────────────────────

  describe("POST /api/v1/portfolio/score", () => {
    test("returns portfolio summary for valid product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2, VALID_ID_3] });
      expect(res.status).toBe(200);

      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBe(3);
      expect(res.body.portfolio_summary).toBeDefined();
      expect(res.body.portfolio_summary.product_count).toBe(3);
      expect(typeof res.body.portfolio_summary.average_score).toBe("number");
      expect(res.body.portfolio_summary.highest).toBeDefined();
      expect(res.body.portfolio_summary.lowest).toBeDefined();
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
    });

    test("returns portfolio for a single valid product ID", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID] });
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBe(1);
      expect(res.body.portfolio_summary.product_count).toBe(1);
    });

    test("portfolio average_score is within 0–10 range", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2] });
      expect(res.status).toBe(200);
      const avg = res.body.portfolio_summary.average_score;
      expect(avg).toBeGreaterThanOrEqual(0);
      expect(avg).toBeLessThanOrEqual(10);
    });

    test("returns 400 when product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
    });

    test("returns 400 when product_ids is not an array", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: "1" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 when product_ids is empty array", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: [] });
      expect(res.status).toBe(400);
    });

    test("returns 400 when product_ids has more than 100 items", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: ids });
      expect(res.status).toBe(400);
    });

    test("returns 400 when any product_id entry is not a string", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2] });
      expect(res.status).toBe(400);
    });

    test("returns 404 when all product_ids are invalid or non-existent", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["999999999", "888888888"] });
      expect(res.status).toBe(404);
    });

    test("silently skips invalid IDs and scores only valid ones", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, "999999999"] });
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBe(1);
      expect(res.body.portfolio_summary.product_count).toBe(1);
    });

    test("each product in portfolio has required passport fields", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2] });
      expect(res.status).toBe(200);
      for (const p of res.body.products) {
        expect(p.product_id).toBeDefined();
        expect(p.greengrade_score).toBeDefined();
        expect(p.emission_breakdown).toBeDefined();
        expect(p.methodology_version).toBe("3.0");
      }
    });
  });

  // ─── GET /api/v1/audit/:productId ─────────────────────────────────────────

  describe("GET /api/v1/audit/:productId", () => {
    test("returns audit structure for a valid product with no changes", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);

      expect(res.body.product_id).toBe(VALID_ID);
      expect(typeof res.body.product_name).toBe("string");
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("returns 400 for non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/bad-id!");
      expect(res.status).toBe(400);
    });

    test("returns 404 for non-existent product ID", async () => {
      const res = await request(app).get("/api/v1/audit/999999999");
      expect(res.status).toBe(404);
    });

    test("returns 400 when limit param is not a number", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=abc`);
      expect(res.status).toBe(400);
    });

    test("returns 400 when offset param is not a number", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?offset=xyz`);
      expect(res.status).toBe(400);
    });

    test("accepts valid limit and offset pagination params", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=10&offset=0`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
    });

    test("total_entries is non-negative", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.total_entries).toBeGreaterThanOrEqual(0);
    });
  });
});
