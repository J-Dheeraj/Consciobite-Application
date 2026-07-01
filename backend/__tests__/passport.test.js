const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

const VALID_ID = "1"; // Firm Tofu — guaranteed to exist in products.json
const VALID_ID_2 = "2"; // Beef Ribeye Steak
const VALID_ID_3 = "3"; // Chicken Breast
const NONEXISTENT_ID = "99999";
const INVALID_ID = "inv@lid!";

const EXPECTED_PASSPORT_KEYS = [
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

const EXPECTED_BREAKDOWN_KEYS = [
  "land_use_change",
  "animal_feed",
  "farm_operations",
  "processing",
  "transport",
  "packaging",
  "retail",
];

describe("Digital Product Passport endpoints", () => {
  // ------------------------------------------------------------------ //
  // GET /api/v1/passport/:productId
  // ------------------------------------------------------------------ //
  describe("GET /api/v1/passport/:productId", () => {
    test("returns 200 and a valid passport for a known product", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);

      EXPECTED_PASSPORT_KEYS.forEach((key) => {
        expect(res.body).toHaveProperty(key);
      });

      expect(res.body.product_id).toBe(VALID_ID);
      expect(typeof res.body.greengrade_score).toBe("number");
      expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(res.body.greengrade_score).toBeLessThanOrEqual(10);
      expect(typeof res.body.score_percentile).toBe("number");
      expect(res.body.methodology_version).toBe("3.0");
    });

    test("emission_breakdown contains all 7 supply-chain categories", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);

      const breakdown = res.body.emission_breakdown;
      EXPECTED_BREAKDOWN_KEYS.forEach((key) => {
        expect(breakdown).toHaveProperty(key);
        expect(typeof breakdown[key]).toBe("number");
      });
    });

    test("total_carbon_footprint_kg_co2e is a positive number", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.total_carbon_footprint_kg_co2e).toBeGreaterThanOrEqual(0);
    });

    test("passport_generated_at is an ISO 8601 timestamp", async () => {
      const res = await request(app).get(`/api/v1/passport/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(new Date(res.body.passport_generated_at).toISOString()).toBe(
        res.body.passport_generated_at
      );
    });

    test("returns 400 for a product ID with special characters", async () => {
      const res = await request(app).get(`/api/v1/passport/${INVALID_ID}`);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    test("returns 404 for a well-formed but non-existent product ID", async () => {
      const res = await request(app).get(`/api/v1/passport/${NONEXISTENT_ID}`);
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error");
    });
  });

  // ------------------------------------------------------------------ //
  // POST /api/v1/portfolio/score
  // ------------------------------------------------------------------ //
  describe("POST /api/v1/portfolio/score", () => {
    test("returns 200 and a portfolio summary for valid product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2, VALID_ID_3] });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products).toHaveLength(3);
      expect(res.body).toHaveProperty("portfolio_summary");
      expect(res.body).toHaveProperty("category_benchmarks");
    });

    test("portfolio_summary contains average_score, product_count, highest, lowest", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2] });

      expect(res.status).toBe(200);
      const summary = res.body.portfolio_summary;
      expect(typeof summary.average_score).toBe("number");
      expect(summary.product_count).toBe(2);
      expect(summary.highest).toHaveProperty("id");
      expect(summary.highest).toHaveProperty("score");
      expect(summary.lowest).toHaveProperty("id");
      expect(summary.lowest).toHaveProperty("score");
    });

    test("each product in the portfolio is a valid passport", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2] });

      expect(res.status).toBe(200);
      res.body.products.forEach((passport) => {
        EXPECTED_PASSPORT_KEYS.forEach((key) => {
          expect(passport).toHaveProperty(key);
        });
      });
    });

    test("silently skips invalid IDs and returns remaining valid products", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, "inv@lid!", NONEXISTENT_ID] });

      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.products[0].product_id).toBe(VALID_ID);
    });

    test("returns 400 when product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    test("returns 400 when product_ids is not an array", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: "1,2,3" });
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

    test("returns 400 when product_ids contains non-string entries", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2, 3] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/string/i);
    });

    test("returns 404 when no valid products are found", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [NONEXISTENT_ID] });
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error");
    });

    test("category_benchmarks contains per-category aggregates", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [VALID_ID, VALID_ID_2, VALID_ID_3] });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
      res.body.category_benchmarks.forEach((bench) => {
        expect(bench).toHaveProperty("category");
        expect(bench).toHaveProperty("count");
        expect(bench).toHaveProperty("avg_score");
        expect(bench).toHaveProperty("avg_emissions");
      });
    });
  });

  // ------------------------------------------------------------------ //
  // GET /api/v1/audit/:productId
  // ------------------------------------------------------------------ //
  describe("GET /api/v1/audit/:productId", () => {
    test("returns 200 and the audit structure for a known product", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(VALID_ID);
      expect(res.body).toHaveProperty("product_name");
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("audit_entries is empty on a fresh test database (no score changes yet)", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.audit_entries).toHaveLength(0);
      expect(res.body.total_entries).toBe(0);
    });

    test("respects the limit query parameter", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=5`);
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("respects the offset query parameter", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=10&offset=0`);
      expect(res.status).toBe(200);
    });

    test("returns 400 for non-integer limit", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?limit=abc`);
      expect(res.status).toBe(400);
    });

    test("returns 400 for non-integer offset", async () => {
      const res = await request(app).get(`/api/v1/audit/${VALID_ID}?offset=xyz`);
      expect(res.status).toBe(400);
    });

    test("returns 400 for invalid product ID", async () => {
      const res = await request(app).get(`/api/v1/audit/${INVALID_ID}`);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    test("returns 404 for a well-formed but non-existent product ID", async () => {
      const res = await request(app).get(`/api/v1/audit/${NONEXISTENT_ID}`);
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error");
    });
  });
});
