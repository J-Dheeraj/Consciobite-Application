const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

// Products 1 and 2 are always present in the static catalog
const VALID_ID = "1";
const VALID_ID_2 = "2";
const INVALID_NONEXISTENT_ID = "99999";

describe("Digital Product Passport endpoints (/api/v1)", () => {
  // -----------------------------------------------------------------------
  // GET /api/v1/passport/:productId
  // -----------------------------------------------------------------------
  describe("GET /api/v1/passport/:productId", () => {
    test("returns 200 with a full passport object for a valid product", async () => {
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
      expect(typeof res.body.total_carbon_footprint_kg_co2e).toBe("number");
      expect(typeof res.body.passport_generated_at).toBe("string");
      expect(res.body.methodology_version).toBe("3.0");
    });

    test("emission_breakdown has all 7 supply-chain categories", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      const keys = [
        "land_use_change",
        "animal_feed",
        "farm_operations",
        "processing",
        "transport",
        "packaging",
        "retail",
      ];
      keys.forEach((k) => {
        expect(res.body.emission_breakdown).toHaveProperty(k);
      });
    });

    test("returns 400 for a non-alphanumeric product ID", async () => {
      // A hyphened ID reaches the handler but fails isAlphanumeric()
      const res = await request(app).get("/api/v1/passport/bad-id");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("returns 404 for a numeric ID that does not exist", async () => {
      const res = await request(app).get(`/api/v1/passport/${INVALID_NONEXISTENT_ID}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // POST /api/v1/portfolio/score
  // -----------------------------------------------------------------------
  describe("POST /api/v1/portfolio/score", () => {
    test("returns 200 with portfolio summary for valid product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2] });
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

    test("portfolio_summary highest/lowest have expected shape", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2] });
      expect(res.status).toBe(200);
      const { highest, lowest } = res.body.portfolio_summary;
      ["id", "name", "score"].forEach((k) => {
        expect(highest).toHaveProperty(k);
        expect(lowest).toHaveProperty(k);
      });
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

    test("returns 400 when product_ids is an empty array", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: [] });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 when product_ids exceeds 100 items", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: ids });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 when product_ids contains non-string entries", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2] });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("returns 404 when all product IDs are invalid or not found", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [INVALID_NONEXISTENT_ID] });
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("silently skips non-alphanumeric IDs and returns 404 if none remain", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["../bad", "!@#$"] });
      expect(res.status).toBe(404);
    });

    test("each passport in portfolio has the expected shape", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID] });
      expect(res.status).toBe(200);
      const passport = res.body.products[0];
      expect(passport.product_id).toBeDefined();
      expect(passport.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(passport.emission_breakdown).toBeDefined();
      expect(passport.methodology_version).toBe("3.0");
    });
  });

  // -----------------------------------------------------------------------
  // GET /api/v1/audit/:productId
  // -----------------------------------------------------------------------
  describe("GET /api/v1/audit/:productId", () => {
    test("returns 200 with audit structure for a valid product", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(typeof res.body.product_name).toBe("string");
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("respects ?limit query parameter", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=5`);
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("respects ?offset query parameter", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=5&offset=0`);
      expect(res.status).toBe(200);
    });

    test("returns 400 for a non-numeric limit", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=abc`);
      expect(res.status).toBe(400);
    });

    test("returns 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/bad-id!");
      expect(res.status).toBe(400);
    });

    test("returns 404 for a numeric ID that does not exist", async () => {
      const res = await request(app).get(`/api/v1/audit/${INVALID_NONEXISTENT_ID}`);
      expect(res.status).toBe(404);
    });
  });
});
