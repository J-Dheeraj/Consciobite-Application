const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Digital Product Passport endpoints", () => {
  const VALID_ID = "1"; // Firm Tofu
  const VALID_ID_2 = "2"; // Beef Ribeye Steak
  const VALID_ID_3 = "3"; // Chicken Breast

  // ── GET /api/v1/passport/:productId ──────────────────────────────────────

  describe("GET /api/v1/passport/:productId", () => {
    test("returns 200 with full passport structure for a valid product", async () => {
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
      expect(typeof p.total_carbon_footprint_kg_co2e).toBe("number");
      expect(p.methodology_version).toBe("3.0");
      expect(typeof p.passport_generated_at).toBe("string");
    });

    test("emission_breakdown contains all 7 supply-chain categories", async () => {
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
      const res = await request(app).get("/api/v1/passport/inv@lid!");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for product ID with spaces", async () => {
      const res = await request(app).get("/api/v1/passport/1 2");
      expect(res.status).toBe(400);
    });

    test("returns 404 for a valid-format but non-existent product ID", async () => {
      const res = await request(app).get("/api/v1/passport/999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });
  });

  // ── POST /api/v1/portfolio/score ─────────────────────────────────────────

  describe("POST /api/v1/portfolio/score", () => {
    test("returns 200 with portfolio summary for valid product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2, VALID_ID_3] });
      expect(res.status).toBe(200);

      const body = res.body;
      expect(Array.isArray(body.products)).toBe(true);
      expect(body.products).toHaveLength(3);
      expect(body.portfolio_summary).toBeDefined();
      expect(typeof body.portfolio_summary.average_score).toBe("number");
      expect(body.portfolio_summary.product_count).toBe(3);
      expect(body.portfolio_summary.highest).toHaveProperty("id");
      expect(body.portfolio_summary.highest).toHaveProperty("name");
      expect(body.portfolio_summary.highest).toHaveProperty("score");
      expect(body.portfolio_summary.lowest).toHaveProperty("id");
      expect(Array.isArray(body.category_benchmarks)).toBe(true);
    });

    test("each product in response has full passport structure", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID] });
      expect(res.status).toBe(200);

      const p = res.body.products[0];
      expect(p).toHaveProperty("product_id");
      expect(p).toHaveProperty("greengrade_score");
      expect(p).toHaveProperty("emission_breakdown");
      expect(p).toHaveProperty("total_carbon_footprint_kg_co2e");
      expect(p).toHaveProperty("methodology_version");
    });

    test("silently skips invalid IDs and scores the rest", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, "inv@lid", "999999"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(1);
    });

    test("returns 400 when product_ids is missing from body", async () => {
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

    test("returns 400 for an empty product_ids array", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: [] });
      expect(res.status).toBe(400);
    });

    test("returns 400 for more than 100 product IDs", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: ids });
      expect(res.status).toBe(400);
    });

    test("returns 400 when any entry is not a string", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/string/i);
    });

    test("returns 404 when all provided IDs resolve to nothing", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["999999", "888888"] });
      expect(res.status).toBe(404);
    });

    test("category_benchmarks aggregates correctly for multi-category input", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2] });
      expect(res.status).toBe(200);

      for (const bench of res.body.category_benchmarks) {
        expect(bench).toHaveProperty("category");
        expect(bench).toHaveProperty("count");
        expect(bench).toHaveProperty("avg_score");
        expect(bench).toHaveProperty("avg_emissions");
      }
    });
  });

  // ── GET /api/v1/audit/:productId ─────────────────────────────────────────

  describe("GET /api/v1/audit/:productId", () => {
    test("returns 200 with audit structure for a valid product", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);

      const body = res.body;
      expect(body.product_id).toBe(VALID_ID);
      expect(typeof body.product_name).toBe("string");
      expect(Array.isArray(body.audit_entries)).toBe(true);
      expect(typeof body.total_entries).toBe("number");
    });

    test("respects the limit query parameter", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=5`);
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("respects the offset query parameter", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?offset=0`);
      expect(res.status).toBe(200);
    });

    test("returns 400 for non-numeric limit", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=abc`);
      expect(res.status).toBe(400);
    });

    test("returns 400 for non-numeric offset", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?offset=abc`);
      expect(res.status).toBe(400);
    });

    test("returns 400 for non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/inv@lid!");
      expect(res.status).toBe(400);
    });

    test("returns 404 for a valid-format but non-existent product ID", async () => {
      const res = await request(app).get("/api/v1/audit/999999");
      expect(res.status).toBe(404);
    });
  });
});
