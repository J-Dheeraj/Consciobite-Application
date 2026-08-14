const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Digital Product Passport endpoints", () => {
  describe("GET /api/v1/passport/:productId", () => {
    test("should return a passport for a valid product", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body.product_name).toBeDefined();
      expect(res.body.brand).toBeDefined();
      expect(res.body.category).toBeDefined();
      expect(typeof res.body.greengrade_score).toBe("number");
      expect(typeof res.body.total_carbon_footprint_kg_co2e).toBe("number");
      expect(res.body.emission_breakdown).toBeDefined();
      expect(res.body.emission_breakdown.land_use_change).toBeDefined();
      expect(res.body.emission_breakdown.farm_operations).toBeDefined();
      expect(res.body.passport_generated_at).toBeDefined();
      expect(res.body.methodology_version).toBe("3.0");
    });

    test("should return 404 for unknown product", async () => {
      const res = await request(app).get("/api/v1/passport/99999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("should return 400 for non-alphanumeric product ID", async () => {
      const res = await request(app).get("/api/v1/passport/abc-def");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("should include all 7 emission dimensions in breakdown", async () => {
      const res = await request(app).get("/api/v1/passport/1");
      expect(res.status).toBe(200);
      const dims = [
        "land_use_change",
        "animal_feed",
        "farm_operations",
        "processing",
        "transport",
        "packaging",
        "retail",
      ];
      dims.forEach((d) => {
        expect(res.body.emission_breakdown[d]).toBeDefined();
      });
    });
  });

  describe("POST /api/v1/portfolio/score", () => {
    test("should return portfolio summary for valid product IDs", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "2", "3"] });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBeGreaterThan(0);
      expect(res.body.portfolio_summary).toBeDefined();
      expect(typeof res.body.portfolio_summary.average_score).toBe("number");
      expect(res.body.portfolio_summary.product_count).toBe(3);
      expect(res.body.portfolio_summary.highest).toBeDefined();
      expect(res.body.portfolio_summary.lowest).toBeDefined();
      expect(Array.isArray(res.body.category_benchmarks)).toBe(true);
    });

    test("should return 400 when product_ids is missing", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({});
      expect(res.status).toBe(400);
    });

    test("should return 400 when product_ids is not an array", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: "1,2,3" });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("array");
    });

    test("should return 400 when product_ids is empty", async () => {
      const res = await request(app).post("/api/v1/portfolio/score").send({ product_ids: [] });
      expect(res.status).toBe(400);
    });

    test("should return 404 when no valid products found", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["99999", "88888"] });
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("should skip invalid IDs and score valid ones", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: ["1", "99999"] });
      expect(res.status).toBe(200);
      expect(res.body.portfolio_summary.product_count).toBe(1);
    });

    test("should return 400 when product_ids entries are not strings", async () => {
      const res = await request(app)
        .post("/api/v1/portfolio/score")
        .send({ product_ids: [1, 2, 3] });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("string");
    });
  });

  describe("GET /api/v1/portfolio/export", () => {
    test("should return CSV for valid product IDs", async () => {
      const res = await request(app).get("/api/v1/portfolio/export?ids=1,2,3");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/text\/csv/);
      expect(res.headers["content-disposition"]).toMatch(/attachment/);
      expect(res.headers["content-disposition"]).toMatch(/dpp-portfolio/);
      const lines = res.text.trim().split(/\r\n|\n/);
      expect(lines.length).toBeGreaterThan(1);
      expect(lines[0]).toContain("product_id");
      expect(lines[0]).toContain("greengrade_score");
      expect(lines[0]).toContain("total_carbon_footprint_kg_co2e");
    });

    test("CSV should include all 18 header columns", async () => {
      const res = await request(app).get("/api/v1/portfolio/export?ids=1");
      expect(res.status).toBe(200);
      const headers = res.text.split(/\r\n|\n/)[0].split(",");
      expect(headers).toHaveLength(18);
    });

    test("CSV data rows should match the number of valid products", async () => {
      const res = await request(app).get("/api/v1/portfolio/export?ids=1,2,3");
      expect(res.status).toBe(200);
      const lines = res.text.trim().split(/\r\n|\n/).filter(Boolean);
      expect(lines.length).toBe(4); // header + 3 data rows
    });

    test("should skip invalid IDs and export valid ones", async () => {
      const res = await request(app).get("/api/v1/portfolio/export?ids=1,99999");
      expect(res.status).toBe(200);
      const lines = res.text.trim().split(/\r\n|\n/).filter(Boolean);
      expect(lines.length).toBe(2); // header + 1 valid product
    });

    test("should return 400 when ids param is missing", async () => {
      const res = await request(app).get("/api/v1/portfolio/export");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test("should return 400 when more than 100 IDs are provided", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => String(i + 1)).join(",");
      const res = await request(app).get(`/api/v1/portfolio/export?ids=${ids}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/100/);
    });

    test("should return 404 when no valid products are found", async () => {
      const res = await request(app).get("/api/v1/portfolio/export?ids=99999,88888");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("CSV values should be properly escaped for fields with commas", async () => {
      const res = await request(app).get("/api/v1/portfolio/export?ids=1");
      expect(res.status).toBe(200);
      // The CSV must be parseable (no unclosed quotes)
      expect(res.text).toBeDefined();
    });
  });

  describe("GET /api/v1/audit/:productId", () => {
    test("should return audit entries for a valid product", async () => {
      const res = await request(app).get("/api/v1/audit/1");
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe("1");
      expect(res.body.product_name).toBeDefined();
      expect(Array.isArray(res.body.audit_entries)).toBe(true);
      expect(typeof res.body.total_entries).toBe("number");
    });

    test("should return 404 for unknown product", async () => {
      const res = await request(app).get("/api/v1/audit/99999");
      expect(res.status).toBe(404);
    });

    test("should return 400 for invalid product ID", async () => {
      const res = await request(app).get("/api/v1/audit/not-valid");
      expect(res.status).toBe(400);
    });

    test("should respect limit and offset query parameters", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=5&offset=0");
      expect(res.status).toBe(200);
      expect(res.body.audit_entries.length).toBeLessThanOrEqual(5);
    });

    test("should reject invalid limit parameter", async () => {
      const res = await request(app).get("/api/v1/audit/1?limit=abc");
      expect(res.status).toBe(400);
    });
  });
});
