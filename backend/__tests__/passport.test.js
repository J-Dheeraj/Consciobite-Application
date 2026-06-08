const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Digital Product Passport endpoints", () => {
  // ── GET /api/v1/passport/:productId ─────────────────────────────────────

  describe("GET /api/v1/passport/:productId", () => {
    test("returns a passport for a valid product", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body.greengrade_score).toBeDefined();
      expect(res.body.emission_breakdown).toBeDefined();
      expect(typeof res.body.emission_breakdown.land_use_change).toBe("number");
      expect(res.body.methodology_version).toBe("3.0");
      expect(res.body.passport_generated_at).toBeDefined();
    });

    test("returns all required passport fields", async () => {
      const res = await request(app).get("/api/v1/passport/2");
      expect(res.status).toBe(200);
      const required = [
        "product_id",
        "product_name",
        "brand",
        "category",
        "greengrade_score",
        "score_percentile",
        "emission_breakdown",
        "total_carbon_footprint_kg_co2e",
        "passport_generated_at",
        "methodology_version",
      ];
      for (const field of required) {
        expect(res.body).toHaveProperty(field);
      }
    });

    test("returns 404 for unknown product", async () => {
      const res = await request(app).get("/api/v1/passport/999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/passport/abc-xyz");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  // ── POST /api/v1/portfolio/score ─────────────────────────────────────────

  describe("POST /api/v1/portfolio/score", () => {
    test("scores a portfolio of valid products", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2"] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBe(2);
      expect(res.body.portfolio_summary).toBeDefined();
      expect(res.body.portfolio_summary.average_score).toBeDefined();
      expect(res.body.portfolio_summary.product_count).toBe(2);
      expect(res.body.portfolio_summary.highest).toBeDefined();
      expect(res.body.portfolio_summary.lowest).toBeDefined();
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
    });

    test("returns 400 when product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
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
    });

    test("returns 404 when no valid products match", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["999998", "999999"] });
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("skips invalid IDs and scores the valid ones", async () => {
      // "999999" is not found, but "1" is valid — should score 1 product
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "999999"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(1);
    });
  });

  // ── GET /api/v1/audit/:productId ─────────────────────────────────────────

  describe("GET /api/v1/audit/:productId", () => {
    test("returns audit log for a valid product", async () => {
      const res = await request(app).get("/api/v1/audit/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body.product_name).toBeDefined();
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("respects limit query param", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=5");
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("respects offset query param", async () => {
      const res = await request(app).get("/api/v1/audit/1?offset=0&limit=10");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
    });

    test("returns 404 for unknown product", async () => {
      const res = await request(app).get("/api/v1/audit/999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/bad-id");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("rejects non-numeric limit", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=abc");
      expect(res.status).toBe(400);
    });

    test("rejects non-numeric offset", async () => {
      const res = await request(app).get("/api/v1/audit/1?offset=xyz");
      expect(res.status).toBe(400);
    });
  });
});
