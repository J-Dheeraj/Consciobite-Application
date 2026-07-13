const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Digital Product Passport endpoints (GET /api/v1/passport/:id)", () => {
  test("returns full passport for a valid product", async () => {
    const res = await request(app).get("/api/v1/passport/1");
    expect(res.status).toBe(200);
    expect(res.body.product_id).toBe("1");
    expect(typeof res.body.product_name).toBe("string");
    expect(typeof res.body.brand).toBe("string");
    expect(typeof res.body.category).toBe("string");
    expect(typeof res.body.greengrade_score).toBe("number");
    expect(res.body.greengrade_score).toBeGreaterThanOrEqual(0);
    expect(res.body.greengrade_score).toBeLessThanOrEqual(10);
    expect(typeof res.body.score_percentile).toBe("number");
    expect(res.body.emission_breakdown).toBeDefined();
    expect(typeof res.body.emission_breakdown.land_use_change).toBe("number");
    expect(typeof res.body.emission_breakdown.animal_feed).toBe("number");
    expect(typeof res.body.emission_breakdown.farm_operations).toBe("number");
    expect(typeof res.body.emission_breakdown.processing).toBe("number");
    expect(typeof res.body.emission_breakdown.transport).toBe("number");
    expect(typeof res.body.emission_breakdown.packaging).toBe("number");
    expect(typeof res.body.emission_breakdown.retail).toBe("number");
    expect(typeof res.body.total_carbon_footprint_kg_co2e).toBe("number");
    expect(res.body.total_carbon_footprint_kg_co2e).toBeGreaterThan(0);
    expect(res.body.methodology_version).toBe("3.0");
    expect(typeof res.body.passport_generated_at).toBe("string");
  });

  test("returns 400 for a non-alphanumeric product ID", async () => {
    const res = await request(app).get("/api/v1/passport/inv@lid!");
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("returns 400 for product ID with special characters", async () => {
    const res = await request(app).get("/api/v1/passport/123-abc");
    expect(res.status).toBe(400);
  });

  test("returns 404 for a valid-format but non-existent product ID", async () => {
    const res = await request(app).get("/api/v1/passport/999999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  test("different products return different passports", async () => {
    const [r1, r2] = await Promise.all([
      request(app).get("/api/v1/passport/1"),
      request(app).get("/api/v1/passport/2"),
    ]);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r1.body.product_id).toBe("1");
    expect(r2.body.product_id).toBe("2");
    expect(r1.body.product_name).not.toBe(r2.body.product_name);
  });
});

describe("Portfolio scoring endpoint (POST /api/v1/portfolio/score)", () => {
  test("returns portfolio summary for valid product IDs", async () => {
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

  test("portfolio summary scores are within valid range", async () => {
    const res = await request(app)
      .post("/api/v1/portfolio/score")
      .send({ product_ids: ["1", "2", "3", "4", "5"] });
    expect(res.status).toBe(200);
    const avg = res.body.portfolio_summary.average_score;
    expect(avg).toBeGreaterThanOrEqual(0);
    expect(avg).toBeLessThanOrEqual(10);
    res.body.products.forEach((p) => {
      expect(p.greengrade_score).toBeGreaterThanOrEqual(0);
      expect(p.greengrade_score).toBeLessThanOrEqual(10);
    });
  });

  test("returns 400 when product_ids is missing", async () => {
    const res = await request(app).post("/api/v1/portfolio/score").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("returns 400 when product_ids is not an array", async () => {
    const res = await request(app)
      .post("/api/v1/portfolio/score")
      .send({ product_ids: "1" });
    expect(res.status).toBe(400);
  });

  test("returns 400 when product_ids is empty", async () => {
    const res = await request(app)
      .post("/api/v1/portfolio/score")
      .send({ product_ids: [] });
    expect(res.status).toBe(400);
  });

  test("returns 400 when product_ids has a non-string entry", async () => {
    const res = await request(app)
      .post("/api/v1/portfolio/score")
      .send({ product_ids: [1, "2"] });
    expect(res.status).toBe(400);
  });

  test("returns 404 when all product_ids are invalid or not found", async () => {
    const res = await request(app)
      .post("/api/v1/portfolio/score")
      .send({ product_ids: ["999999", "888888"] });
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  test("silently skips invalid IDs and scores valid ones", async () => {
    const res = await request(app)
      .post("/api/v1/portfolio/score")
      .send({ product_ids: ["1", "999999"] });
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(1);
    expect(res.body.products[0].product_id).toBe("1");
  });

  test("returns 400 when product_ids exceeds 100 items", async () => {
    const ids = Array.from({ length: 101 }, (_, i) => String(i + 1));
    const res = await request(app)
      .post("/api/v1/portfolio/score")
      .send({ product_ids: ids });
    expect(res.status).toBe(400);
  });

  test("single-product portfolio has matching highest and lowest", async () => {
    const res = await request(app)
      .post("/api/v1/portfolio/score")
      .send({ product_ids: ["1"] });
    expect(res.status).toBe(200);
    const { highest, lowest } = res.body.portfolio_summary;
    expect(highest.id).toBe(lowest.id);
    expect(highest.score).toBe(lowest.score);
  });
});

describe("Product score audit endpoint (GET /api/v1/audit/:productId)", () => {
  test("returns audit data structure for a valid product", async () => {
    const res = await request(app).get("/api/v1/audit/1");
    expect(res.status).toBe(200);
    expect(res.body.product_id).toBe("1");
    expect(typeof res.body.product_name).toBe("string");
    expect(Array.isArray(res.body.audit_entries)).toBe(true);
    expect(typeof res.body.total_entries).toBe("number");
    expect(res.body.total_entries).toBeGreaterThanOrEqual(0);
  });

  test("respects limit parameter", async () => {
    const res = await request(app).get("/api/v1/audit/1?limit=5");
    expect(res.status).toBe(200);
    expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
  });

  test("respects offset parameter", async () => {
    const res = await request(app).get("/api/v1/audit/1?limit=10&offset=0");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.audit_entries)).toBe(true);
  });

  test("returns 400 for non-alphanumeric product ID", async () => {
    const res = await request(app).get("/api/v1/audit/inv@lid!");
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("returns 404 for valid-format but non-existent product ID", async () => {
    const res = await request(app).get("/api/v1/audit/999999");
    expect(res.status).toBe(404);
  });

  test("returns 400 for non-integer limit", async () => {
    const res = await request(app).get("/api/v1/audit/1?limit=abc");
    expect(res.status).toBe(400);
  });

  test("returns 400 for non-integer offset", async () => {
    const res = await request(app).get("/api/v1/audit/1?offset=1.5");
    expect(res.status).toBe(400);
  });

  test("caps limit at 500 entries", async () => {
    const res = await request(app).get("/api/v1/audit/1?limit=9999");
    expect(res.status).toBe(200);
    expect(res.body.audit_entries.length).toBeLessThanOrEqual(500);
  });
});
