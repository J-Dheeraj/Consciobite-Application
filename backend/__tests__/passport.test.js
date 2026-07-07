const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Digital Product Passport endpoints", () => {
  describe("GET /api/v1/passport/:productId", () => {
    test("returns a valid passport for a known product", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body.product_name).toBe("Firm Tofu");
      expect(typeof res.body.greengrade_score).toBe("number");
      expect(typeof res.body.total_carbon_footprint_kg_co2e).toBe("number");
      expect(res.body.emission_breakdown).toBeDefined();
      expect(res.body.emission_breakdown).toHaveProperty("land_use_change");
      expect(res.body.emission_breakdown).toHaveProperty("animal_feed");
      expect(res.body.emission_breakdown).toHaveProperty("farm_operations");
      expect(res.body.emission_breakdown).toHaveProperty("processing");
      expect(res.body.emission_breakdown).toHaveProperty("transport");
      expect(res.body.emission_breakdown).toHaveProperty("packaging");
      expect(res.body.emission_breakdown).toHaveProperty("retail");
      expect(res.body.methodology_version).toBe("3.0");
      expect(typeof res.body.passport_generated_at).toBe("string");
    });

    test("returns 404 for an unknown product ID", async () => {
      const res = await request(app).get("/api/v1/passport/999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/passport/bad-id!");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("score_percentile is between 0 and 100", async () => {
      const res = await request(app).get("/api/v1/passport/2");
      expect(res.status).toBe(200);
      expect(res.body.score_percentile).toBeGreaterThanOrEqual(0);
      expect(res.body.score_percentile).toBeLessThanOrEqual(100);
    });

    test("includes data confidence fields", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      expect("data_confidence_tier" in res.body).toBe(true);
      expect("data_confidence_label" in res.body).toBe(true);
    });
  });

  describe("POST /api/v1/portfolio/score", () => {
    test("scores a valid list of product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBe(3);
      expect(res.body.portfolio_summary).toBeDefined();
      expect(typeof res.body.portfolio_summary.average_score).toBe("number");
      expect(res.body.portfolio_summary.product_count).toBe(3);
      expect(res.body.portfolio_summary.highest).toBeDefined();
      expect(res.body.portfolio_summary.lowest).toBeDefined();
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
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

    test("returns 400 when product_ids is empty", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: [] });
      expect(res.status).toBe(400);
    });

    test("returns 400 when product_ids contains non-string entries", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2] });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("returns 404 when none of the IDs match products", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["999998", "999999"] });
      expect(res.status).toBe(404);
    });

    test("skips invalid IDs silently and scores valid ones", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "999999"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(1);
    });

    test("returns 400 when more than 100 IDs are sent", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: ids });
      expect(res.status).toBe(400);
    });

    test("portfolio summary highest score >= lowest score", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);
      const { highest, lowest } = res.body.portfolio_summary;
      expect(highest.score).toBeGreaterThanOrEqual(lowest.score);
    });
  });

  describe("GET /api/v1/audit/:productId", () => {
    test("returns audit data for a known product", async () => {
      const res = await request(app).get("/api/v1/audit/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body.product_name).toBe("Firm Tofu");
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("returns 404 for an unknown product ID", async () => {
      const res = await request(app).get("/api/v1/audit/999999");
      expect(res.status).toBe(404);
    });

    test("returns 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/bad-id!");
      expect(res.status).toBe(400);
    });

    test("respects limit query parameter", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=5");
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("respects offset query parameter", async () => {
      const res = await request(app).get("/api/v1/audit/1?offset=0");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
    });

    test("rejects non-numeric limit", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=abc");
      expect(res.status).toBe(400);
    });

    test("total_entries is a non-negative integer", async () => {
      const res = await request(app).get("/api/v1/audit/1");
      expect(res.status).toBe(200);
      expect(res.body.total_entries).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(res.body.total_entries)).toBe(true);
    });
  });
});
