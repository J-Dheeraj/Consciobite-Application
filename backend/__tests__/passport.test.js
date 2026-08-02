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

  describe("GET /api/v1/portfolio/export", () => {
    test("should return CSV for valid ids", async () => {
      const res = await request(app).get("/api/v1/portfolio/export?ids=1,2,3");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/text\/csv/);
      expect(res.headers["content-disposition"]).toMatch(/portfolio-export\.csv/);
      expect(res.text).toMatch(/GreenGrade Score/);
      expect(res.text).toMatch(/Product ID/);
    });

    test("should return JSON when format=json", async () => {
      const res = await request(app).get("/api/v1/portfolio/export?ids=1,2&format=json");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/application\/json/);
      expect(res.headers["content-disposition"]).toMatch(/portfolio-export\.json/);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.product_count).toBe(2);
    });

    test("should return CSV for category filter", async () => {
      const res = await request(app).get("/api/v1/portfolio/export?category=Beverages");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/text\/csv/);
      expect(res.text.split("\n").length).toBeGreaterThan(1);
    });

    test("CSV rows contain all 7 emission dimensions", async () => {
      const res = await request(app).get("/api/v1/portfolio/export?ids=1&format=csv");
      expect(res.status).toBe(200);
      const header = res.text.split("\n")[0];
      expect(header).toContain("Land Use Change");
      expect(header).toContain("Animal Feed");
      expect(header).toContain("Farm Operations");
      expect(header).toContain("Processing");
      expect(header).toContain("Transport");
      expect(header).toContain("Packaging");
      expect(header).toContain("Retail");
    });

    test("should return 400 when neither ids nor category provided", async () => {
      const res = await request(app).get("/api/v1/portfolio/export");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/ids or category/);
    });

    test("should return 400 when both ids and category provided", async () => {
      const res = await request(app).get("/api/v1/portfolio/export?ids=1&category=Dairy");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/either/);
    });

    test("should return 400 for invalid format", async () => {
      const res = await request(app).get("/api/v1/portfolio/export?ids=1&format=xml");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/format/);
    });

    test("should return 404 when no valid ids found", async () => {
      const res = await request(app).get("/api/v1/portfolio/export?ids=99999,88888");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test("should skip invalid IDs and export valid ones", async () => {
      const res = await request(app).get(
        "/api/v1/portfolio/export?ids=1,not-valid,99999&format=json"
      );
      expect(res.status).toBe(200);
      expect(res.body.product_count).toBe(1);
    });

    test("JSON export includes methodology_version and passport_generated_at", async () => {
      const res = await request(app).get("/api/v1/portfolio/export?ids=1&format=json");
      expect(res.status).toBe(200);
      const product = res.body.products[0];
      expect(product.methodology_version).toBe("3.0");
      expect(product.passport_generated_at).toBeDefined();
    });
  });
});
