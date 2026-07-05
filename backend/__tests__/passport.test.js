process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../src/index");

// Product IDs from the catalog; "1" = Firm Tofu (first entry).
const VALID_ID = "1";
const NONEXISTENT_ID = "999999";

describe("Digital Product Passport API", () => {
  // ------------------------------------------------------------------ //
  //  GET /api/v1/passport/:productId
  // ------------------------------------------------------------------ //
  describe("GET /api/v1/passport/:productId", () => {
    test("returns a passport for a valid product", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);

      // Top-level shape
      expect(res.body.product_id).toBe(VALID_ID);
      expect(typeof res.body.product_name).toBe("string");
      expect(typeof res.body.brand).toBe("string");
      expect(typeof res.body.category).toBe("string");
      expect(typeof res.body.greengrade_score).toBe("number");
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(res.body.greengrade_score).toBeLessThanOrEqual(10);

      // Emission breakdown — all 7 categories must be present
      const bd = res.body.emission_breakdown;
      expect(bd).toBeDefined();
      expect(typeof bd.land_use_change).toBe("number");
      expect(typeof bd.animal_feed).toBe("number");
      expect(typeof bd.farm_operations).toBe("number");
      expect(typeof bd.processing).toBe("number");
      expect(typeof bd.transport).toBe("number");
      expect(typeof bd.packaging).toBe("number");
      expect(typeof bd.retail).toBe("number");

      expect(typeof res.body.total_carbon_footprint_kg_co2e).toBe("number");
      expect(res.body.methodology_version).toBe("3.0");
      expect(typeof res.body.passport_generated_at).toBe("string");
    });

    test("returns 404 for a product that does not exist", async () => {
      const res = await request(app).get(`/api/v1/passport/${NONEXISTENT_ID}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/passport/abc!");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("score_percentile is a number when present", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      if (res.body.score_percentile !== null && res.body.score_percentile !== undefined) {
        expect(typeof res.body.score_percentile).toBe("number");
      }
    });
  });

  // ------------------------------------------------------------------ //
  //  POST /api/v1/portfolio/score
  // ------------------------------------------------------------------ //
  describe("POST /api/v1/portfolio/score", () => {
    test("scores a valid portfolio of product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, "2", "3"] });
      expect(res.status).toBe(200);

      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBeGreaterThan(0);

      const summary = res.body.portfolio_summary;
      expect(typeof summary.average_score).toBe("number");
      expect(typeof summary.product_count).toBe("number");
      expect(summary.highest).toBeDefined();
      expect(summary.lowest).toBeDefined();
      expect(typeof summary.highest.id).toBe("string");
      expect(typeof summary.lowest.id).toBe("string");

      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
    });

    test("each product in the portfolio response has correct passport shape", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID] });
      expect(res.status).toBe(200);
      const p = res.body.products[0];
      expect(p.product_id).toBeDefined();
      expect(p.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(p.emission_breakdown).toBeDefined();
      expect(p.methodology_version).toBe("3.0");
    });

    test("returns 400 when product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
    });

    test("returns 400 when product_ids is not an array", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: "1" });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/array/i);
    });

    test("returns 400 when product_ids is an empty array", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: [] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/between 1 and 100/i);
    });

    test("returns 400 when product_ids exceeds 100 entries", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: ids });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/between 1 and 100/i);
    });

    test("returns 400 when an entry in product_ids is not a string", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2, 3] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/string/i);
    });

    test("returns 404 when all IDs are non-existent or invalid", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["999999", "888888"] });
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("silently skips invalid IDs and scores the valid ones", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, "999999"] });
      expect(res.status).toBe(200);
      // The valid product should be in the result
      expect(res.body.products.some((p) => p.product_id === VALID_ID)).toBe(true);
    });

    test("category_benchmarks contains correct fields", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, "2", "3", "4", "5"] });
      expect(res.status).toBe(200);
      res.body.category_benchmarks.forEach((bench) => {
        expect(typeof bench.category).toBe("string");
        expect(typeof bench.count).toBe("number");
        expect(typeof bench.avg_score).toBe("number");
        expect(typeof bench.avg_emissions).toBe("number");
      });
    });
  });

  // ------------------------------------------------------------------ //
  //  GET /api/v1/audit/:productId
  // ------------------------------------------------------------------ //
  describe("GET /api/v1/audit/:productId", () => {
    test("returns audit entries for a valid product", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(typeof res.body.product_name).toBe("string");
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("returns 404 for a non-existent product", async () => {
      const res = await request(app).get(`/api/v1/audit/${NONEXISTENT_ID}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/bad!");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("respects limit and offset query params", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=5&offset=0`);
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("returns 400 for non-integer limit param", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=abc`);
      expect(res.status).toBe(400);
    });

    test("returns 400 for non-integer offset param", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?offset=xyz`);
      expect(res.status).toBe(400);
    });

    test("total_entries is >= 0", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.total_entries).toBeGreaterThanOrEqual(0);
    });
  });
});
