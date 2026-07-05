const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

// Real product IDs from products.json fixture
const VALID_ID = "1"; // Firm Tofu
const VALID_ID_2 = "2"; // Beef Ribeye Steak
const VALID_ID_3 = "3"; // Chicken Breast
const UNKNOWN_ID = "99999";

describe("B2B Passport API (/api/v1)", () => {
  // -----------------------------------------------------------------------
  // GET /api/v1/passport/:productId
  // -----------------------------------------------------------------------
  describe("GET /api/v1/passport/:productId", () => {
    test("returns 200 with full passport structure for a valid product", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);

      // Top-level shape
      expect(res.body.product_id).toBe(VALID_ID);
      expect(typeof res.body.product_name).toBe("string");
      expect(typeof res.body.brand).toBe("string");
      expect(typeof res.body.category).toBe("string");
      expect(res.body.methodology_version).toBe("3.0");

      // Score fields
      expect(typeof res.body.greengrade_score).toBe("number");
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(res.body.greengrade_score).toBeLessThanOrEqual(10);
      expect(typeof res.body.score_percentile).toBe("number");
      expect(typeof res.body.total_carbon_footprint_kg_co2e).toBe("number");

      // Emission breakdown has all 7 categories
      const eb = res.body.emission_breakdown;
      expect(eb).toBeDefined();
      expect(typeof eb.land_use_change).toBe("number");
      expect(typeof eb.animal_feed).toBe("number");
      expect(typeof eb.farm_operations).toBe("number");
      expect(typeof eb.processing).toBe("number");
      expect(typeof eb.transport).toBe("number");
      expect(typeof eb.packaging).toBe("number");
      expect(typeof eb.retail).toBe("number");

      // Metadata
      expect(typeof res.body.passport_generated_at).toBe("string");
      expect(() => new Date(res.body.passport_generated_at)).not.toThrow();
    });

    test("returns 400 for an ID containing special characters", async () => {
      const res = await request(app).get("/api/v1/passport/bad!id");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid product ID/i);
    });

    test("returns 400 for an ID with spaces", async () => {
      const res = await request(app).get("/api/v1/passport/1 2");
      expect(res.status).toBe(400);
    });

    test("returns 404 for a well-formed ID that does not exist", async () => {
      const res = await request(app).get(`/api/v1/passport/${UNKNOWN_ID}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Product not found/i);
    });

    test("data_confidence_tier is present (may be null if untrained)", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect("data_confidence_tier" in res.body).toBe(true);
      expect("data_confidence_label" in res.body).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // POST /api/v1/portfolio/score
  // -----------------------------------------------------------------------
  describe("POST /api/v1/portfolio/score", () => {
    test("returns 200 with valid product_ids array", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2, VALID_ID_3] });
      expect(res.status).toBe(200);
    });

    test("response includes products, portfolio_summary, and category_benchmarks", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2, VALID_ID_3] });
      expect(res.status).toBe(200);

      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBeGreaterThan(0);

      const summary = res.body.portfolio_summary;
      expect(typeof summary.average_score).toBe("number");
      expect(typeof summary.product_count).toBe("number");
      expect(summary.product_count).toBe(res.body.products.length);
      expect(summary.highest).toHaveProperty("id");
      expect(summary.highest).toHaveProperty("name");
      expect(summary.highest).toHaveProperty("score");
      expect(summary.lowest).toHaveProperty("id");

      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
      res.body.category_benchmarks.forEach((bm) => {
        expect(bm).toHaveProperty("category");
        expect(typeof bm.count).toBe("number");
        expect(typeof bm.avg_score).toBe("number");
        expect(typeof bm.avg_emissions).toBe("number");
      });
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

    test("returns 400 when product_ids is empty", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/between 1 and 100/i);
    });

    test("returns 400 when product_ids has more than 100 items", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ids });
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

    test("returns 404 when all IDs are unknown", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [UNKNOWN_ID, "88888"] });
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/No valid products/i);
    });

    test("silently skips invalid IDs and returns valid ones", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, UNKNOWN_ID, "bad!id"] });
      expect(res.status).toBe(200);
      // Only the one valid product should come back
      expect(res.body.products.length).toBe(1);
      expect(res.body.products[0].product_id).toBe(VALID_ID);
    });

    test("single-product portfolio has matching highest and lowest", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID] });
      expect(res.status).toBe(200);
      const { highest, lowest } = res.body.portfolio_summary;
      expect(highest.id).toBe(lowest.id);
      expect(highest.score).toBe(lowest.score);
    });
  });

  // -----------------------------------------------------------------------
  // GET /api/v1/audit/:productId
  // -----------------------------------------------------------------------
  describe("GET /api/v1/audit/:productId", () => {
    test("returns 200 with audit structure for a known product", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(typeof res.body.product_name).toBe("string");
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("audit_entries is empty on a fresh test DB (no rescores run)", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      // In a test environment with a fresh DB there are no score-change logs
      expect(res.body.total_entries).toBe(0);
      expect(res.body.audit_entries).toHaveLength(0);
    });

    test("returns 400 for an ID with special characters", async () => {
      const res = await request(app).get("/api/v1/audit/bad!id");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid product ID/i);
    });

    test("returns 404 for a well-formed but unknown product ID", async () => {
      const res = await request(app).get(`/api/v1/audit/${UNKNOWN_ID}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Product not found/i);
    });

    test("returns 400 for a non-numeric limit query param", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=abc`);
      expect(res.status).toBe(400);
    });

    test("returns 400 for a non-numeric offset query param", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?offset=xyz`);
      expect(res.status).toBe(400);
    });

    test("respects numeric limit and offset params", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=10&offset=0`);
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(10);
    });
  });
});
