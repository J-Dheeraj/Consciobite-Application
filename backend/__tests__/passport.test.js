const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

const VALID_ID = "1"; // Firm Tofu
const VALID_ID_2 = "2"; // Beef Ribeye Steak
const VALID_ID_3 = "3"; // Chicken Breast

describe("Digital Product Passport endpoints", () => {
  describe("GET /api/v1/passport/:productId", () => {
    test("returns 200 with full passport for valid product", async () => {
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
      expect(typeof res.body.total_carbon_footprint_kg_co2e).toBe("number");
      expect(res.body.passport_generated_at).toBeDefined();
      expect(res.body.methodology_version).toBe("3.0");
    });

    test("emission_breakdown has all 7 supply-chain categories", async () => {
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

    test("returns 404 for non-existent product ID", async () => {
      const res = await request(app).get("/api/v1/passport/99999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/passport/inv@lid");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for product ID with special characters", async () => {
      const res = await request(app).get("/api/v1/passport/abc-def");
      expect(res.status).toBe(400);
    });

    test("passport_generated_at is a valid ISO timestamp", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(new Date(res.body.passport_generated_at).toISOString()).toBe(
        res.body.passport_generated_at
      );
    });
  });

  describe("POST /api/v1/portfolio/score", () => {
    test("returns 200 with portfolio summary for valid product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2, VALID_ID_3] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products).toHaveLength(3);
      expect(res.body.portfolio_summary).toBeDefined();
      expect(res.body.portfolio_summary.product_count).toBe(3);
      expect(typeof res.body.portfolio_summary.average_score).toBe("number");
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
    });

    test("portfolio_summary contains highest and lowest product", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2] });
      expect(res.status).toBe(200);
      const { highest, lowest } = res.body.portfolio_summary;
      expect(highest.id).toBeDefined();
      expect(highest.name).toBeDefined();
      expect(typeof highest.score).toBe("number");
      expect(lowest.id).toBeDefined();
      expect(typeof lowest.score).toBe("number");
      expect(highest.score).toBeGreaterThanOrEqual(lowest.score);
    });

    test("each product entry has full passport fields", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID] });
      expect(res.status).toBe(200);
      const p = res.body.products[0];
      expect(p.product_id).toBeDefined();
      expect(p.greengrade_score).toBeDefined();
      expect(p.emission_breakdown).toBeDefined();
      expect(p.methodology_version).toBe("3.0");
    });

    test("silently skips invalid IDs and processes valid ones", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, "inv@lid", "99999999"] });
      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.products[0].product_id).toBe(VALID_ID);
    });

    test("returns 404 when no valid products found", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["99999997", "99999998"] });
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
        .send({ product_ids: VALID_ID });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/array/i);
    });

    test("returns 400 when product_ids is empty", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [] });
      expect(res.status).toBe(400);
    });

    test("returns 400 when product_ids exceeds 100 items", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ids });
      expect(res.status).toBe(400);
    });

    test("returns 400 when product_ids contains non-string entries", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2, 3] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/string/i);
    });

    test("category_benchmarks groups products correctly", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2, VALID_ID_3] });
      expect(res.status).toBe(200);
      res.body.category_benchmarks.forEach((bench) => {
        expect(bench.category).toBeDefined();
        expect(typeof bench.count).toBe("number");
        expect(typeof bench.avg_score).toBe("number");
        expect(typeof bench.avg_emissions).toBe("number");
      });
    });
  });

  describe("GET /api/v1/audit/:productId", () => {
    test("returns 200 with audit data for valid product", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(res.body.product_name).toBeDefined();
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("returns 404 for non-existent product", async () => {
      const res = await request(app).get("/api/v1/audit/99999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/inv@lid");
      expect(res.status).toBe(400);
    });

    test("respects limit query parameter", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=5`);
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("respects offset query parameter", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?offset=0`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
    });

    test("returns 400 for non-numeric limit", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=abc`);
      expect(res.status).toBe(400);
    });

    test("returns 400 for non-numeric offset", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?offset=abc`);
      expect(res.status).toBe(400);
    });

    test("total_entries matches database count", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.total_entries).toBeGreaterThanOrEqual(0);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(res.body.total_entries + 1);
    });
  });
});
