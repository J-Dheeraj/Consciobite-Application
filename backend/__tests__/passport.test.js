const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Digital Product Passport API (/api/v1)", () => {
  describe("GET /api/v1/passport/:productId", () => {
    test("should return a valid passport for a known product", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body.product_name).toBeDefined();
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(res.body.greengrade_score).toBeLessThanOrEqual(10);
      expect(res.body.emission_breakdown).toBeDefined();
      expect(res.body.total_carbon_footprint_kg_co2e).toBeGreaterThanOrEqual(0);
      expect(res.body.methodology_version).toBe("3.0");
      expect(res.body.passport_generated_at).toBeDefined();
    });

    test("should include all 7 emission categories in breakdown", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      const bd = res.body.emission_breakdown;
      expect(bd).toHaveProperty("land_use_change");
      expect(bd).toHaveProperty("animal_feed");
      expect(bd).toHaveProperty("farm_operations");
      expect(bd).toHaveProperty("processing");
      expect(bd).toHaveProperty("transport");
      expect(bd).toHaveProperty("packaging");
      expect(bd).toHaveProperty("retail");
    });

    test("should return 400 for non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/passport/inv@lid!");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("should return 404 for unknown product ID", async () => {
      const res = await request(app).get("/api/v1/passport/99999");
      expect(res.status).toBe(404);
    });

    test("should return passport for last product in catalog (id=550)", async () => {
      const res = await request(app).get("/api/v1/passport/550");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("550");
    });
  });

  describe("POST /api/v1/portfolio/score", () => {
    test("should return portfolio summary for valid product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBe(3);
      expect(res.body.portfolio_summary).toBeDefined();
      expect(res.body.portfolio_summary.product_count).toBe(3);
      expect(res.body.portfolio_summary.average_score).toBeGreaterThanOrEqual(0);
      expect(res.body.portfolio_summary.highest).toBeDefined();
      expect(res.body.portfolio_summary.lowest).toBeDefined();
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
    });

    test("should return portfolio summary for a single product", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(1);
      expect(res.body.portfolio_summary.highest.id).toBe(
        res.body.portfolio_summary.lowest.id
      );
    });

    test("should return 400 when product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
    });

    test("should return 400 when product_ids is not an array", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: "1" });
      expect(res.status).toBe(400);
    });

    test("should return 400 when product_ids is empty array", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [] });
      expect(res.status).toBe(400);
    });

    test("should return 400 when product_ids exceeds 100 items", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ids });
      expect(res.status).toBe(400);
    });

    test("should return 400 when a product_id entry is not a string", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2] });
      expect(res.status).toBe(400);
    });

    test("should return 404 when all IDs are unknown", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["99998", "99999"] });
      expect(res.status).toBe(404);
    });

    test("should silently skip unknown IDs and score only valid ones", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "99999"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(1);
    });
  });

  describe("GET /api/v1/audit/:productId", () => {
    test("should return audit entries for a known product", async () => {
      const res = await request(app).get("/api/v1/audit/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body.product_name).toBeDefined();
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("should respect limit and offset query params", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=2&offset=0");
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(2);
    });

    test("should return 400 for non-numeric limit param", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=abc");
      expect(res.status).toBe(400);
    });

    test("should return 400 for non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/inv@lid!");
      expect(res.status).toBe(400);
    });

    test("should return 404 for unknown product ID", async () => {
      const res = await request(app).get("/api/v1/audit/99999");
      expect(res.status).toBe(404);
    });
  });
});
