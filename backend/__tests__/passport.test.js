const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

const VALID_ID = "1"; // Firm Tofu
const VALID_ID_2 = "2"; // Beef Ribeye Steak
const VALID_ID_3 = "3"; // Chicken Breast

describe("Digital Product Passport API (/api/v1)", () => {
  // -------------------------------------------------------
  // GET /api/v1/passport/:productId
  // -------------------------------------------------------
  describe("GET /api/v1/passport/:productId", () => {
    test("returns a valid passport for a known product", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(typeof res.body.product_name).toBe("string");
      expect(typeof res.body.brand).toBe("string");
      expect(typeof res.body.category).toBe("string");
      expect(typeof res.body.greengrade_score).toBe("number");
      expect(typeof res.body.score_percentile).toBe("number");
      expect(typeof res.body.total_carbon_footprint_kg_co2e).toBe("number");
      expect(res.body.methodology_version).toBe("3.0");
      expect(typeof res.body.passport_generated_at).toBe("string");
    });

    test("emission_breakdown contains all 7 supply-chain categories", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
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

    test("returns 404 for an unknown product ID", async () => {
      const res = await request(app).get("/api/v1/passport/99999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });

    test("returns 400 for a non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/passport/bad-id!");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid/i);
    });

    test("different products return different scores", async () => {
      const [res1, res2] = await Promise.all([
        request(app).get(`/api/v1/passport/${VALID_ID}`),
        request(app).get(`/api/v1/passport/${VALID_ID_2}`),
      ]);
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      // Tofu and Beef Ribeye should have meaningfully different scores
      expect(res1.body.greengrade_score).not.toBe(res2.body.greengrade_score);
    });

    test("score is within valid range 0–10", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(res.body.greengrade_score).toBeLessThanOrEqual(10);
    });

    test("passport_generated_at is a valid ISO 8601 timestamp", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      const ts = Date.parse(res.body.passport_generated_at);
      expect(Number.isNaN(ts)).toBe(false);
    });
  });

  // -------------------------------------------------------
  // POST /api/v1/portfolio/score
  // -------------------------------------------------------
  describe("POST /api/v1/portfolio/score", () => {
    test("scores a portfolio of valid product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2, VALID_ID_3] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBe(3);
      expect(res.body.portfolio_summary).toBeDefined();
      expect(typeof res.body.portfolio_summary.average_score).toBe("number");
      expect(res.body.portfolio_summary.product_count).toBe(3);
    });

    test("portfolio_summary includes highest and lowest products", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2] });
      expect(res.status).toBe(200);
      const { highest, lowest } = res.body.portfolio_summary;
      expect(highest).toHaveProperty("id");
      expect(highest).toHaveProperty("name");
      expect(highest).toHaveProperty("score");
      expect(lowest).toHaveProperty("id");
      expect(lowest).toHaveProperty("score");
      expect(highest.score).toBeGreaterThanOrEqual(lowest.score);
    });

    test("includes category_benchmarks in response", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2, VALID_ID_3] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
      for (const bench of res.body.category_benchmarks) {
        expect(typeof bench.category).toBe("string");
        expect(typeof bench.count).toBe("number");
        expect(typeof bench.avg_score).toBe("number");
        expect(typeof bench.avg_emissions).toBe("number");
      }
    });

    test("silently drops unknown IDs but still succeeds with valid ones", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, "99999999"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(1);
    });

    test("returns 404 when all product IDs are invalid", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["99999999", "88888888"] });
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/no valid products/i);
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
      expect(res.body.error).toMatch(/must be an array/i);
    });

    test("returns 400 when product_ids is empty", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/between 1 and 100/i);
    });

    test("returns 400 when product_ids exceeds 100 items", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ids });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/between 1 and 100/i);
    });

    test("returns 400 when a product_ids entry is not a string", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2, 3] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/must be a string/i);
    });

    test("average_score is rounded to one decimal place", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2, VALID_ID_3] });
      expect(res.status).toBe(200);
      const avg = res.body.portfolio_summary.average_score;
      expect(Number.isInteger(avg * 10)).toBe(true);
    });
  });

  // -------------------------------------------------------
  // GET /api/v1/audit/:productId
  // -------------------------------------------------------
  describe("GET /api/v1/audit/:productId", () => {
    test("returns audit log for a known product", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(typeof res.body.product_name).toBe("string");
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("returns 404 for unknown product", async () => {
      const res = await request(app).get("/api/v1/audit/99999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });

    test("returns 400 for non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/audit/bad-id!");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid/i);
    });

    test("accepts valid limit and offset query params", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=10&offset=0`);
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(10);
    });

    test("rejects non-numeric limit", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=abc`);
      expect(res.status).toBe(400);
    });

    test("rejects non-numeric offset", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?offset=xyz`);
      expect(res.status).toBe(400);
    });

    test("total_entries is non-negative", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.total_entries).toBeGreaterThanOrEqual(0);
    });
  });
});
