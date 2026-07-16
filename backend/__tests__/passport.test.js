const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

const VALID_ID = "1"; // Firm Tofu
const VALID_ID_2 = "2"; // Beef Ribeye Steak
const VALID_ID_3 = "3"; // Chicken Breast

describe("Digital Product Passport API (/api/v1)", () => {
  describe("GET /api/v1/passport/:productId", () => {
    test("returns a passport for a known product", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(typeof res.body.product_name).toBe("string");
      expect(typeof res.body.brand).toBe("string");
      expect(typeof res.body.category).toBe("string");
      expect(typeof res.body.greengrade_score).toBe("number");
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(res.body.greengrade_score).toBeLessThanOrEqual(10);
      expect(res.body.methodology_version).toBe("3.0");
    });

    test("passport includes all 7 emission breakdown fields", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      const b = res.body.emission_breakdown;
      expect(b).toHaveProperty("land_use_change");
      expect(b).toHaveProperty("animal_feed");
      expect(b).toHaveProperty("farm_operations");
      expect(b).toHaveProperty("processing");
      expect(b).toHaveProperty("transport");
      expect(b).toHaveProperty("packaging");
      expect(b).toHaveProperty("retail");
    });

    test("passport includes total_carbon_footprint_kg_co2e", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(typeof res.body.total_carbon_footprint_kg_co2e).toBe("number");
      expect(res.body.total_carbon_footprint_kg_co2e).toBeGreaterThanOrEqual(0);
    });

    test("passport includes passport_generated_at ISO timestamp", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(typeof res.body.passport_generated_at).toBe("string");
      expect(() => new Date(res.body.passport_generated_at)).not.toThrow();
    });

    test("returns 404 for unknown product ID", async () => {
      const res = await request(app).get("/api/v1/passport/999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for non-alphanumeric product ID", async () => {
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
      expect(res.body.portfolio_summary.product_count).toBe(3);
      expect(typeof res.body.portfolio_summary.average_score).toBe("number");
    });

    test("portfolio_summary includes highest and lowest scoring products", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2] });
      expect(res.status).toBe(200);
      const { highest, lowest } = res.body.portfolio_summary;
      expect(highest).toHaveProperty("id");
      expect(highest).toHaveProperty("name");
      expect(highest).toHaveProperty("score");
      expect(lowest).toHaveProperty("id");
      expect(lowest.score).toBeLessThanOrEqual(highest.score);
    });

    test("returns category_benchmarks grouped by category", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
      res.body.category_benchmarks.forEach((bench) => {
        expect(bench).toHaveProperty("category");
        expect(bench).toHaveProperty("count");
        expect(bench).toHaveProperty("avg_score");
        expect(bench).toHaveProperty("avg_emissions");
      });
    });

    test("silently skips unknown IDs and returns only valid products", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, "999999"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(1);
      expect(res.body.products[0].product_id).toBe(VALID_ID);
    });

    test("returns 404 when all IDs are unknown", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["999998", "999999"] });
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
      expect(res.body.error).toContain("array");
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

    test("returns 400 when a product_id entry is not a string", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2] });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("string");
    });
  });

  describe("GET /api/v1/audit/:productId", () => {
    test("returns audit trail for a known product", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(typeof res.body.product_name).toBe("string");
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("total_entries is non-negative", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.total_entries).toBeGreaterThanOrEqual(0);
    });

    test("accepts valid limit and offset query params", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=10&offset=0`);
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(10);
    });

    test("returns 400 for non-numeric limit param", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=abc`);
      expect(res.status).toBe(400);
    });

    test("returns 400 for non-numeric offset param", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?offset=abc`);
      expect(res.status).toBe(400);
    });

    test("returns 404 for unknown product ID", async () => {
      const res = await request(app).get("/api/v1/audit/999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/bad-id!");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });
});
