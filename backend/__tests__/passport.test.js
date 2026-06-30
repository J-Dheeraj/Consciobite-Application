const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

// Product id "1" (Firm Tofu) is guaranteed to exist in products.json
const KNOWN_ID = "1";
const KNOWN_ID_2 = "2";
const UNKNOWN_ID = "999999";
const INVALID_ID = "not-valid!";

describe("Digital Product Passport endpoints", () => {
  describe("GET /api/v1/passport/:productId", () => {
    test("returns a valid passport for a known product", async () => {
      const res = await request(app).get(`/api/v1/passport/${KNOWN_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(KNOWN_ID);
      expect(typeof res.body.product_name).toBe("string");
      expect(typeof res.body.greengrade_score).toBe("number");
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(res.body.greengrade_score).toBeLessThanOrEqual(10);
      expect(res.body.emission_breakdown).toBeDefined();
      expect(typeof res.body.total_carbon_footprint_kg_co2e).toBe("number");
      expect(res.body.methodology_version).toBe("3.0");
      expect(typeof res.body.passport_generated_at).toBe("string");
    });

    test("emission_breakdown has all 7 categories", async () => {
      const res = await request(app).get(`/api/v1/passport/${KNOWN_ID}`);
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

    test("returns 404 for an unknown product id", async () => {
      const res = await request(app).get(`/api/v1/passport/${UNKNOWN_ID}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for an invalid (non-alphanumeric) product id", async () => {
      const res = await request(app).get(`/api/v1/passport/${encodeURIComponent(INVALID_ID)}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe("POST /api/v1/portfolio/score", () => {
    test("returns portfolio summary for valid product ids", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [KNOWN_ID, KNOWN_ID_2] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBe(2);
      expect(res.body.portfolio_summary).toBeDefined();
      expect(typeof res.body.portfolio_summary.average_score).toBe("number");
      expect(res.body.portfolio_summary.product_count).toBe(2);
      expect(res.body.portfolio_summary.highest).toBeDefined();
      expect(res.body.portfolio_summary.lowest).toBeDefined();
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
    });

    test("each product in response has passport shape", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [KNOWN_ID] });
      expect(res.status).toBe(200);
      const p = res.body.products[0];
      expect(p.product_id).toBe(KNOWN_ID);
      expect(typeof p.greengrade_score).toBe("number");
      expect(p.emission_breakdown).toBeDefined();
    });

    test("returns 400 when product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
    });

    test("returns 400 when product_ids is not an array", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: KNOWN_ID });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/array/i);
    });

    test("returns 400 when product_ids is empty", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [] });
      expect(res.status).toBe(400);
    });

    test("returns 400 when product_ids has more than 100 items", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ids });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/100/);
    });

    test("returns 400 when product_ids contains non-string entries", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/string/i);
    });

    test("returns 404 when all provided ids are invalid or unknown", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [UNKNOWN_ID] });
      expect(res.status).toBe(404);
    });

    test("silently skips non-alphanumeric ids in a mixed batch", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [KNOWN_ID, "bad!id"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(1);
    });
  });

  describe("GET /api/v1/audit/:productId", () => {
    test("returns audit structure for a known product", async () => {
      const res = await request(app).get(`/api/v1/audit/${KNOWN_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(KNOWN_ID);
      expect(typeof res.body.product_name).toBe("string");
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("respects limit and offset query params", async () => {
      const res = await request(app).get(`/api/v1/audit/${KNOWN_ID}?limit=5&offset=0`);
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("returns 400 for non-numeric limit", async () => {
      const res = await request(app).get(`/api/v1/audit/${KNOWN_ID}?limit=abc`);
      expect(res.status).toBe(400);
    });

    test("returns 400 for non-numeric offset", async () => {
      const res = await request(app).get(`/api/v1/audit/${KNOWN_ID}?offset=xyz`);
      expect(res.status).toBe(400);
    });

    test("returns 404 for an unknown product id", async () => {
      const res = await request(app).get(`/api/v1/audit/${UNKNOWN_ID}`);
      expect(res.status).toBe(404);
    });

    test("returns 400 for an invalid (non-alphanumeric) product id", async () => {
      const res = await request(app).get(`/api/v1/audit/${encodeURIComponent(INVALID_ID)}`);
      expect(res.status).toBe(400);
    });
  });
});
