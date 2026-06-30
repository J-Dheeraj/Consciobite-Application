const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

// Use a product ID known to exist in products.json
const VALID_PRODUCT_ID = "1";
const NONEXISTENT_ID = "999999";

describe("Digital Product Passport endpoints (/api/v1)", () => {
  // ─── GET /api/v1/passport/:productId ────────────────────────────────────────
  describe("GET /api/v1/passport/:productId", () => {
    test("returns a well-formed passport for a valid product", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_PRODUCT_ID}`);
      expect(res.status).toBe(200);

      const p = res.body;
      expect(p.product_id).toBe(VALID_PRODUCT_ID);
      expect(typeof p.product_name).toBe("string");
      expect(typeof p.brand).toBe("string");
      expect(typeof p.category).toBe("string");
      expect(typeof p.greengrade_score).toBe("number");
      expect(p.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(p.greengrade_score).toBeLessThanOrEqual(10);
      expect(typeof p.score_percentile).toBe("number");
      expect(typeof p.total_carbon_footprint_kg_co2e).toBe("number");
      expect(p.methodology_version).toBe("3.0");
      expect(p.passport_generated_at).toBeDefined();

      // emission breakdown must have all 7 supply-chain categories
      const eb = p.emission_breakdown;
      expect(typeof eb.land_use_change).toBe("number");
      expect(typeof eb.animal_feed).toBe("number");
      expect(typeof eb.farm_operations).toBe("number");
      expect(typeof eb.processing).toBe("number");
      expect(typeof eb.transport).toBe("number");
      expect(typeof eb.packaging).toBe("number");
      expect(typeof eb.retail).toBe("number");
    });

    test("returns 404 for a product that does not exist", async () => {
      const res = await request(app).get(`/api/v1/passport/${NONEXISTENT_ID}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for a non-alphanumeric product ID", async () => {
      // Use a URL-encoded special character that survives Express routing intact
      const res = await request(app).get("/api/v1/passport/bad%21id");
      expect(res.status).toBe(400);
    });

    test("passport_generated_at is a valid ISO 8601 timestamp", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_PRODUCT_ID}`);
      expect(res.status).toBe(200);
      const d = new Date(res.body.passport_generated_at);
      expect(d.toISOString()).toBe(res.body.passport_generated_at);
    });

    test("data_confidence_tier and label are present (null or string)", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_PRODUCT_ID}`);
      expect(res.status).toBe(200);
      // These fields may be null if the model hasn't classified a tier yet
      expect("data_confidence_tier" in res.body).toBe(true);
      expect("data_confidence_label" in res.body).toBe(true);
    });
  });

  // ─── POST /api/v1/portfolio/score ───────────────────────────────────────────
  describe("POST /api/v1/portfolio/score", () => {
    test("returns portfolio summary for a valid list of product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);

      const { products, portfolio_summary, category_benchmarks } = res.body;
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBe(3);

      expect(typeof portfolio_summary.average_score).toBe("number");
      expect(portfolio_summary.product_count).toBe(3);
      expect(portfolio_summary.highest).toBeDefined();
      expect(portfolio_summary.lowest).toBeDefined();
      expect(typeof portfolio_summary.highest.score).toBe("number");
      expect(typeof portfolio_summary.lowest.score).toBe("number");

      expect(Array.isArray(category_benchmarks)).toBe(true);
      category_benchmarks.forEach((bench) => {
        expect(typeof bench.category).toBe("string");
        expect(typeof bench.count).toBe("number");
        expect(typeof bench.avg_score).toBe("number");
        expect(typeof bench.avg_emissions).toBe("number");
      });
    });

    test("returns 400 when product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
    });

    test("returns 400 when product_ids is not an array", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: "1" });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("array");
    });

    test("returns 400 for an empty product_ids array", async () => {
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

    test("returns 400 when a product_ids entry is not a string", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2] });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("string");
    });

    test("returns 404 when none of the IDs match a product", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["999998", "999999"] });
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("silently skips non-alphanumeric IDs and still returns valid results", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["../../bad", "1"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(1);
    });

    test("highest and lowest scores are consistent with the products list", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);

      const scores = res.body.products.map((p) => p.greengrade_score);
      const { highest, lowest } = res.body.portfolio_summary;
      expect(highest.score).toBe(Math.max(...scores));
      expect(lowest.score).toBe(Math.min(...scores));
    });

    test("average_score is rounded to 1 decimal place", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2"] });
      expect(res.status).toBe(200);
      const avg = res.body.portfolio_summary.average_score;
      expect(Number(avg.toFixed(1))).toBe(avg);
    });
  });

  // ─── GET /api/v1/audit/:productId ───────────────────────────────────────────
  describe("GET /api/v1/audit/:productId", () => {
    test("returns audit log structure for a valid product", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_PRODUCT_ID}`);
      expect(res.status).toBe(200);

      expect(res.body.product_id).toBe(VALID_PRODUCT_ID);
      expect(typeof res.body.product_name).toBe("string");
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("returns 404 for a product that does not exist", async () => {
      const res = await request(app).get(`/api/v1/audit/${NONEXISTENT_ID}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("returns 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/bad!id");
      expect(res.status).toBe(400);
    });

    test("respects the limit query parameter", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_PRODUCT_ID}?limit=5`);
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("rejects a non-numeric limit", async () => {
      const res = await request(app).get(
        `/api/v1/audit/${VALID_PRODUCT_ID}?limit=abc`
      );
      expect(res.status).toBe(400);
    });

    test("rejects a non-numeric offset", async () => {
      const res = await request(app).get(
        `/api/v1/audit/${VALID_PRODUCT_ID}?offset=xyz`
      );
      expect(res.status).toBe(400);
    });

    test("total_entries reflects the full count regardless of limit", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_PRODUCT_ID}?limit=1`);
      expect(res.status).toBe(200);
      // total_entries is always >= audit_entries.length
      expect(res.body.total_entries).toBeGreaterThanOrEqual(
        res.body.audit_entries.length
      );
    });
  });
});
