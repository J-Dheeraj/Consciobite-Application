process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../src/index");

// Use two known products from the 550-product catalog.
const VALID_ID_1 = "1"; // Firm Tofu (low-emission)
const VALID_ID_2 = "2"; // Beef Ribeye Steak (high-emission)
const NONEXISTENT_ID = "999999";
const INVALID_ID = "inv@lid!"; // contains non-alphanumeric chars

describe("Digital Product Passport routes (/api/v1)", () => {
  // -----------------------------------------------------------------------
  describe("GET /api/v1/passport/:productId", () => {
    test("returns a passport for a valid product", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID_1}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID_1);
      expect(res.body.product_name).toBeDefined();
      expect(res.body.brand).toBeDefined();
      expect(res.body.category).toBeDefined();
    });

    test("passport has the required top-level fields", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID_1}`);
      expect(res.status).toBe(200);
      const body = res.body;
      expect(typeof body.greengrade_score).toBe("number");
      expect(body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(body.greengrade_score).toBeLessThanOrEqual(10);
      expect(typeof body.score_percentile).toBe("number");
      expect(typeof body.total_carbon_footprint_kg_co2e).toBe("number");
      expect(body.passport_generated_at).toBeDefined();
      expect(body.methodology_version).toBe("3.0");
    });

    test("emission_breakdown has all 7 supply-chain stages", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID_1}`);
      expect(res.status).toBe(200);
      const eb = res.body.emission_breakdown;
      expect(eb).toBeDefined();
      expect(typeof eb.land_use_change).toBe("number");
      expect(typeof eb.animal_feed).toBe("number");
      expect(typeof eb.farm_operations).toBe("number");
      expect(typeof eb.processing).toBe("number");
      expect(typeof eb.transport).toBe("number");
      expect(typeof eb.packaging).toBe("number");
      expect(typeof eb.retail).toBe("number");
    });

    test("different products have different passports", async () => {
      const [r1, r2] = await Promise.all([
        request(app).get(`/api/v1/passport/${VALID_ID_1}`),
        request(app).get(`/api/v1/passport/${VALID_ID_2}`),
      ]);
      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
      expect(r1.body.product_id).not.toBe(r2.body.product_id);
      // Beef ribeye (id 2) has far higher emissions than tofu (id 1)
      expect(r2.body.greengrade_score).toBeLessThan(r1.body.greengrade_score);
    });

    test("returns 404 for a non-existent product", async () => {
      const res = await request(app).get(`/api/v1/passport/${NONEXISTENT_ID}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for a product ID with invalid characters", async () => {
      const res = await request(app).get("/api/v1/passport/inv%40lid!");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("returns 404 for an alphanumeric ID that does not exist", async () => {
      const res = await request(app).get("/api/v1/passport/abc999");
      expect(res.status).toBe(404);
    });
  });

  // -----------------------------------------------------------------------
  describe("POST /api/v1/portfolio/score", () => {
    test("scores a portfolio of valid product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID_1, VALID_ID_2] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products).toHaveLength(2);
    });

    test("response contains a portfolio_summary", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID_1, VALID_ID_2] });
      expect(res.status).toBe(200);
      const summary = res.body.portfolio_summary;
      expect(summary).toBeDefined();
      expect(typeof summary.average_score).toBe("number");
      expect(summary.product_count).toBe(2);
      expect(summary.highest).toBeDefined();
      expect(summary.lowest).toBeDefined();
      expect(summary.highest.id).toBeDefined();
      expect(summary.lowest.id).toBeDefined();
    });

    test("response contains category_benchmarks", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID_1, VALID_ID_2] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
      res.body.category_benchmarks.forEach((cb) => {
        expect(cb.category).toBeDefined();
        expect(typeof cb.count).toBe("number");
        expect(typeof cb.avg_score).toBe("number");
        expect(typeof cb.avg_emissions).toBe("number");
      });
    });

    test("each product in response has passport shape", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID_1] });
      expect(res.status).toBe(200);
      const p = res.body.products[0];
      expect(p.product_id).toBeDefined();
      expect(typeof p.greengrade_score).toBe("number");
      expect(p.emission_breakdown).toBeDefined();
      expect(p.methodology_version).toBe("3.0");
    });

    test("silently skips invalid IDs and scores the rest", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID_1, "inv@lid!", VALID_ID_2] });
      expect(res.status).toBe(200);
      // inv@lid! gets skipped by sanitize(); valid IDs pass through
      expect(res.body.products.length).toBeGreaterThanOrEqual(1);
    });

    test("returns 404 when all IDs are unknown", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [NONEXISTENT_ID, "888888"] });
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 when product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
    });

    test("returns 400 when product_ids is not an array", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: "1,2" });
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
      const tooMany = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: tooMany });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/100/);
    });

    test("returns 400 when a product_ids entry is not a string", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/string/i);
    });

    test("highest and lowest are the same product for a single-item portfolio", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID_1] });
      expect(res.status).toBe(200);
      const { highest, lowest } = res.body.portfolio_summary;
      expect(highest.id).toBe(lowest.id);
    });
  });

  // -----------------------------------------------------------------------
  describe("GET /api/v1/audit/:productId", () => {
    test("returns audit entries for a valid product", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID_1}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID_1);
      expect(res.body.product_name).toBeDefined();
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("audit_entries is empty on a fresh database (no score changes yet)", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID_1}`);
      expect(res.status).toBe(200);
      // In test env the DB is in-memory; no prior runs => no score changes
      expect(res.body.total_entries).toBe(0);
      expect(res.body.audit_entries).toHaveLength(0);
    });

    test("returns 404 for a non-existent product", async () => {
      const res = await request(app).get(`/api/v1/audit/${NONEXISTENT_ID}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for an invalid product ID", async () => {
      const res = await request(app).get("/api/v1/audit/inv%40lid!");
      expect(res.status).toBe(400);
    });

    test("respects the limit query parameter", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID_1}?limit=10`);
      expect(res.status).toBe(200);
    });

    test("respects the offset query parameter", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID_1}?offset=0`);
      expect(res.status).toBe(200);
    });

    test("returns 400 for non-numeric limit", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID_1}?limit=abc`);
      expect(res.status).toBe(400);
    });

    test("returns 400 for non-numeric offset", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID_1}?offset=xyz`);
      expect(res.status).toBe(400);
    });
  });
});
