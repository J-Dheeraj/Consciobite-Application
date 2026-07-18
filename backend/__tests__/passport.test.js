const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

const VALID_ID = "1"; // Firm Tofu
const VALID_ID_2 = "2"; // Beef Ribeye Steak

describe("Digital Product Passport endpoints (/api/v1)", () => {
  // -----------------------------------------------------------------------
  // GET /api/v1/passport/:productId
  // -----------------------------------------------------------------------
  describe("GET /api/v1/passport/:productId", () => {
    test("returns full passport for a valid product", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(res.body.product_name).toBeDefined();
      expect(res.body.brand).toBeDefined();
      expect(res.body.category).toBeDefined();
    });

    test("passport contains required scoring fields", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(typeof res.body.greengrade_score).toBe("number");
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(res.body.greengrade_score).toBeLessThanOrEqual(10);
      expect(typeof res.body.total_carbon_footprint_kg_co2e).toBe("number");
      expect(res.body.methodology_version).toBe("3.0");
      expect(res.body.passport_generated_at).toBeDefined();
    });

    test("emission_breakdown contains all 7 supply-chain stages", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      const { emission_breakdown } = res.body;
      expect(emission_breakdown).toBeDefined();
      expect(typeof emission_breakdown.land_use_change).toBe("number");
      expect(typeof emission_breakdown.animal_feed).toBe("number");
      expect(typeof emission_breakdown.farm_operations).toBe("number");
      expect(typeof emission_breakdown.processing).toBe("number");
      expect(typeof emission_breakdown.transport).toBe("number");
      expect(typeof emission_breakdown.packaging).toBe("number");
      expect(typeof emission_breakdown.retail).toBe("number");
    });

    test("returns 404 for an unknown product id", async () => {
      const res = await request(app).get("/api/v1/passport/99999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for a non-alphanumeric product id", async () => {
      const res = await request(app).get("/api/v1/passport/bad-id!");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("second product also returns a valid passport", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID_2}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID_2);
    });
  });

  // -----------------------------------------------------------------------
  // POST /api/v1/portfolio/score
  // -----------------------------------------------------------------------
  describe("POST /api/v1/portfolio/score", () => {
    test("returns portfolio summary for valid product ids", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products).toHaveLength(2);
    });

    test("portfolio_summary has required shape", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2] });
      expect(res.status).toBe(200);
      const { portfolio_summary } = res.body;
      expect(typeof portfolio_summary.average_score).toBe("number");
      expect(portfolio_summary.product_count).toBe(2);
      expect(portfolio_summary.highest).toBeDefined();
      expect(portfolio_summary.lowest).toBeDefined();
    });

    test("highest and lowest scores are correct for two products", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2] });
      expect(res.status).toBe(200);
      const { highest, lowest } = res.body.portfolio_summary;
      expect(highest.score).toBeGreaterThanOrEqual(lowest.score);
    });

    test("category_benchmarks is an array of objects", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
      res.body.category_benchmarks.forEach((b) => {
        expect(b.category).toBeDefined();
        expect(typeof b.count).toBe("number");
        expect(typeof b.avg_score).toBe("number");
        expect(typeof b.avg_emissions).toBe("number");
      });
    });

    test("single valid id returns portfolio with one product", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(1);
      expect(res.body.portfolio_summary.highest.id).toBe(res.body.portfolio_summary.lowest.id);
    });

    test("silently skips unknown ids and scores remaining products", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["99999", VALID_ID] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(1);
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
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: [] });
      expect(res.status).toBe(400);
    });

    test("returns 400 when product_ids contains a non-string entry", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/string/i);
    });

    test("returns 404 when all ids are invalid/unknown", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["99999", "88888"] });
      expect(res.status).toBe(404);
    });

    test("returns 400 when product_ids exceeds 100 items", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: ids });
      expect(res.status).toBe(400);
    });
  });

  // -----------------------------------------------------------------------
  // GET /api/v1/audit/:productId
  // -----------------------------------------------------------------------
  describe("GET /api/v1/audit/:productId", () => {
    test("returns audit trail for a valid product", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(res.body.product_name).toBeDefined();
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("audit_entries defaults to empty array when no changes logged", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.total_entries).toBeGreaterThanOrEqual(0);
    });

    test("respects limit query parameter", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=5`);
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("respects offset query parameter", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?offset=0`);
      expect(res.status).toBe(200);
    });

    test("returns 404 for an unknown product id", async () => {
      const res = await request(app).get("/api/v1/audit/99999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for a non-alphanumeric product id", async () => {
      const res = await request(app).get("/api/v1/audit/bad-id!");
      expect(res.status).toBe(400);
    });

    test("returns 400 for non-numeric limit", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=abc`);
      expect(res.status).toBe(400);
    });

    test("returns 400 for non-numeric offset", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?offset=xyz`);
      expect(res.status).toBe(400);
    });
  });
});
