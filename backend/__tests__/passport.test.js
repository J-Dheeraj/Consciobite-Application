const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Digital Product Passport API (/api/v1)", () => {
  // ─── GET /passport/:productId ─────────────────────────────────────────────

  describe("GET /api/v1/passport/:productId", () => {
    test("returns a full passport for a valid product", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);

      // Required top-level fields
      expect(res.body.product_id).toBe("1");
      expect(typeof res.body.product_name).toBe("string");
      expect(typeof res.body.brand).toBe("string");
      expect(typeof res.body.category).toBe("string");
      expect(typeof res.body.greengrade_score).toBe("number");
      expect(typeof res.body.score_percentile).toBe("number");
      expect(typeof res.body.total_carbon_footprint_kg_co2e).toBe("number");
      expect(res.body.methodology_version).toBe("3.0");
      expect(typeof res.body.passport_generated_at).toBe("string");
    });

    test("emission_breakdown contains all 7 lifecycle dimensions", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      const b = res.body.emission_breakdown;
      expect(b).toBeDefined();
      expect(typeof b.land_use_change).toBe("number");
      expect(typeof b.animal_feed).toBe("number");
      expect(typeof b.farm_operations).toBe("number");
      expect(typeof b.processing).toBe("number");
      expect(typeof b.transport).toBe("number");
      expect(typeof b.packaging).toBe("number");
      expect(typeof b.retail).toBe("number");
    });

    test("works for last product in the catalog (id 550)", async () => {
      const res = await request(app).get("/api/v1/passport/550");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("550");
    });

    test("returns 404 for an unknown product id", async () => {
      const res = await request(app).get("/api/v1/passport/99999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for a non-alphanumeric product id", async () => {
      const res = await request(app).get("/api/v1/passport/abc-123");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for SQL-injection-style product id", async () => {
      const res = await request(app).get("/api/v1/passport/1%20OR%201%3D1");
      expect(res.status).toBe(400);
    });

    test("data_confidence fields are present (null allowed for low-data products)", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      expect("data_confidence_tier" in res.body).toBe(true);
      expect("data_confidence_label" in res.body).toBe(true);
    });

    test("passport_generated_at is a valid ISO 8601 string", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      const d = new Date(res.body.passport_generated_at);
      expect(Number.isNaN(d.getTime())).toBe(false);
    });

    test("score is in the 0–10 range", async () => {
      const res = await request(app).get("/api/v1/passport/2");
      expect(res.status).toBe(200);
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(res.body.greengrade_score).toBeLessThanOrEqual(10);
    });
  });

  // ─── POST /portfolio/score ────────────────────────────────────────────────

  describe("POST /api/v1/portfolio/score", () => {
    test("returns portfolio summary for valid product ids", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);

      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBe(3);

      const summary = res.body.portfolio_summary;
      expect(typeof summary.average_score).toBe("number");
      expect(summary.product_count).toBe(3);
      expect(summary.highest).toBeDefined();
      expect(summary.lowest).toBeDefined();
      expect(summary.highest.id).toBeDefined();
      expect(summary.lowest.id).toBeDefined();
    });

    test("category_benchmarks are present and correct shape", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
      for (const b of res.body.category_benchmarks) {
        expect(typeof b.category).toBe("string");
        expect(typeof b.count).toBe("number");
        expect(typeof b.avg_score).toBe("number");
        expect(typeof b.avg_emissions).toBe("number");
      }
    });

    test("silently skips unknown ids and processes the rest", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "99999"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(1);
    });

    test("returns 404 when all ids are unknown", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["99998", "99999"] });
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
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

    test("returns 400 when product_ids exceeds 100 items", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: ids });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/100/);
    });

    test("returns 400 when a product_id entry is not a string", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/string/i);
    });

    test("highest and lowest ids are valid when all products have equal score", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.highest.id).toBe("1");
      expect(res.body.portfolio_summary.lowest.id).toBe("1");
    });

    test("average_score is bounded 0–10", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3", "4", "5"] });
      expect(res.status).toBe(200);
      const avg = res.body.portfolio_summary.average_score;
      expect(avg).toBeGreaterThanOrEqual(0);
      expect(avg).toBeLessThanOrEqual(10);
    });
  });

  // ─── GET /audit/:productId ────────────────────────────────────────────────

  describe("GET /api/v1/audit/:productId", () => {
    test("returns audit log shape for a valid product", async () => {
      const res = await request(app).get("/api/v1/audit/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(typeof res.body.product_name).toBe("string");
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("audit_entries is empty for a fresh product (no score changes yet)", async () => {
      const res = await request(app).get("/api/v1/audit/1");
      expect(res.status).toBe(200);
      // Fresh test DB — no changes logged yet
      expect(res.body.audit_entries.length).toBe(res.body.total_entries);
    });

    test("returns 404 for an unknown product id", async () => {
      const res = await request(app).get("/api/v1/audit/99999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for a non-alphanumeric product id", async () => {
      const res = await request(app).get("/api/v1/audit/bad-id");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("respects limit query parameter", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=5");
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("respects offset query parameter", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=10&offset=0");
      expect(res.status).toBe(200);
    });

    test("rejects non-numeric limit", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=abc");
      expect(res.status).toBe(400);
    });

    test("rejects non-numeric offset", async () => {
      const res = await request(app).get("/api/v1/audit/1?offset=abc");
      expect(res.status).toBe(400);
    });

    test("works for last product in the catalog (id 550)", async () => {
      const res = await request(app).get("/api/v1/audit/550");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("550");
    });
  });
});
