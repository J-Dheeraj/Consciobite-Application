const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

// Known products from products.json — used to exercise happy paths.
const PRODUCT_1_ID = "1"; // Firm Tofu, Protein
const PRODUCT_2_ID = "2"; // Beef Ribeye Steak, Protein
const PRODUCT_1_BARCODE = "8888001010101";

describe("Products route", () => {
  describe("GET /api/products — listing", () => {
    test("returns 200 with products array and pagination meta", async () => {
      const res = await request(app).get("/api/products");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBeGreaterThan(0);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: expect.any(Number),
        totalCount: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });

    test("each product in the listing has a valid greenGrade", async () => {
      const res = await request(app).get("/api/products?limit=5");
      expect(res.status).toBe(200);
      for (const p of res.body.products) {
        expect(p.greenGrade).toBeDefined();
        expect(typeof p.greenGrade.score).toBe("number");
        expect(p.greenGrade.score).toBeGreaterThanOrEqual(0);
        expect(p.greenGrade.score).toBeLessThanOrEqual(10);
        expect(["green", "yellow", "red"]).toContain(p.greenGrade.color);
        expect(Array.isArray(p.greenGrade.breakdown)).toBe(true);
        expect(p.greenGrade.breakdown).toHaveLength(7);
      }
    });

    test("respects ?limit= parameter", async () => {
      const res = await request(app).get("/api/products?limit=3");
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeLessThanOrEqual(3);
      expect(res.body.pagination.limit).toBe(3);
    });

    test("clamps limit above MAX_PAGE_SIZE to 100", async () => {
      const res = await request(app).get("/api/products?limit=9999");
      expect(res.status).toBe(200);
      expect(res.body.pagination.limit).toBe(100);
    });

    test("invalid limit (0) falls back to the default page size", async () => {
      // parseInt("0") is falsy so the route falls back to DEFAULT_PAGE_SIZE (20)
      const res = await request(app).get("/api/products?limit=0");
      expect(res.status).toBe(200);
      expect(res.body.pagination.limit).toBe(20);
    });

    test("handles ?page=2 and advances the window", async () => {
      const page1 = await request(app).get("/api/products?limit=5&page=1");
      const page2 = await request(app).get("/api/products?limit=5&page=2");
      expect(page1.status).toBe(200);
      expect(page2.status).toBe(200);
      const ids1 = page1.body.products.map((p) => p.id);
      const ids2 = page2.body.products.map((p) => p.id);
      // Pages should not overlap
      expect(ids1.some((id) => ids2.includes(id))).toBe(false);
      expect(page2.body.pagination.hasPrev).toBe(true);
    });

    test("page beyond totalPages returns empty products array", async () => {
      const res = await request(app).get("/api/products?page=999999");
      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(0);
    });

    test("filters by category (case-insensitive)", async () => {
      const res = await request(app).get("/api/products?category=protein&limit=10");
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeGreaterThan(0);
      for (const p of res.body.products) {
        expect(p.category.toLowerCase()).toBe("protein");
      }
    });

    test("filters by search term (matches name/brand/category)", async () => {
      const res = await request(app).get("/api/products?search=tofu&limit=5");
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeGreaterThan(0);
      for (const p of res.body.products) {
        const haystack = `${p.name} ${p.brand} ${p.category}`.toLowerCase();
        expect(haystack).toContain("tofu");
      }
    });

    test("combined search + category filter narrows results", async () => {
      const all = await request(app).get("/api/products?category=Protein&limit=100");
      const filtered = await request(app).get(
        "/api/products?category=Protein&search=tofu&limit=100"
      );
      expect(filtered.body.pagination.totalCount).toBeLessThanOrEqual(
        all.body.pagination.totalCount
      );
    });

    test("unknown search term returns empty list", async () => {
      const res = await request(app).get("/api/products?search=zzznonexistentproduct999&limit=5");
      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(0);
      expect(res.body.pagination.totalCount).toBe(0);
    });

    test("sort=grade_asc returns ascending scores", async () => {
      const res = await request(app).get("/api/products?sort=grade_asc&limit=20");
      expect(res.status).toBe(200);
      const scores = res.body.products.map((p) => p.greenGrade.score);
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
      }
    });

    test("sort=grade_desc returns descending scores", async () => {
      const res = await request(app).get("/api/products?sort=grade_desc&limit=20");
      expect(res.status).toBe(200);
      const scores = res.body.products.map((p) => p.greenGrade.score);
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
      }
    });

    test("sort=emissions_asc returns ascending total emissions", async () => {
      const res = await request(app).get("/api/products?sort=emissions_asc&limit=20");
      expect(res.status).toBe(200);
      const emissions = res.body.products.map((p) => p.greenGrade.totalEmissions);
      for (let i = 1; i < emissions.length; i++) {
        expect(emissions[i]).toBeGreaterThanOrEqual(emissions[i - 1]);
      }
    });

    test("sort=emissions_desc returns descending total emissions", async () => {
      const res = await request(app).get("/api/products?sort=emissions_desc&limit=20");
      expect(res.status).toBe(200);
      const emissions = res.body.products.map((p) => p.greenGrade.totalEmissions);
      for (let i = 1; i < emissions.length; i++) {
        expect(emissions[i]).toBeLessThanOrEqual(emissions[i - 1]);
      }
    });

    test("unknown sort value falls back to default order", async () => {
      const res = await request(app).get("/api/products?sort=unknown_sort&limit=5");
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/products/stats", () => {
    test("returns total product count and per-category stats", async () => {
      const res = await request(app).get("/api/products/stats");
      expect(res.status).toBe(200);
      expect(typeof res.body.totalProducts).toBe("number");
      expect(res.body.totalProducts).toBeGreaterThan(0);
      expect(Array.isArray(res.body.categories)).toBe(true);
      expect(res.body.categories.length).toBeGreaterThan(0);
    });

    test("each category stat has required fields", async () => {
      const res = await request(app).get("/api/products/stats");
      for (const cat of res.body.categories) {
        expect(cat).toHaveProperty("category");
        expect(cat).toHaveProperty("productCount");
        expect(cat.productCount).toBeGreaterThan(0);
        expect(cat).toHaveProperty("avgScore");
        expect(cat.avgScore).toBeGreaterThanOrEqual(0);
        expect(cat).toHaveProperty("avgEmissions");
        expect(cat.avgEmissions).toBeGreaterThanOrEqual(0);
      }
    });

    test("categories are sorted by avgScore descending", async () => {
      const res = await request(app).get("/api/products/stats");
      const scores = res.body.categories.map((c) => c.avgScore);
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
      }
    });
  });

  describe("GET /api/products/:id", () => {
    test("returns 200 with full enriched product for a known id", async () => {
      const res = await request(app).get(`/api/products/${PRODUCT_1_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(PRODUCT_1_ID);
      expect(res.body.greenGrade).toBeDefined();
      expect(res.body.greenGrade.breakdown).toHaveLength(7);
      expect(typeof res.body.greenGrade.score).toBe("number");
      expect(typeof res.body.greenGrade.totalEmissions).toBe("number");
      // percentile is only present on products enriched after trainModel() has run
      // (the pre-computed enrichedProducts array is built before training at module load)
    });

    test("returned product includes emissions object with all 7 keys", async () => {
      const res = await request(app).get(`/api/products/${PRODUCT_1_ID}`);
      const { emissions } = res.body;
      for (const key of [
        "landUseChange",
        "animalFeed",
        "farm",
        "processing",
        "transport",
        "packaging",
        "retail",
      ]) {
        expect(typeof emissions[key]).toBe("number");
      }
    });

    test("returns 400 for id with special characters", async () => {
      const res = await request(app).get("/api/products/inv@lid!");
      expect(res.status).toBe(400);
    });

    test("returns 404 for alphanumeric id that does not exist", async () => {
      const res = await request(app).get("/api/products/zzzzzzzz99");
      expect(res.status).toBe(404);
    });

    test("off_ id — returns 400 for non-numeric barcode", async () => {
      const res = await request(app).get("/api/products/off_notanumber");
      expect(res.status).toBe(400);
    });

    test("off_ id — returns 400 for too-short barcode", async () => {
      const res = await request(app).get("/api/products/off_1234");
      expect(res.status).toBe(400);
    });

    test("off_ id — returns 404 in test env (external API is skipped)", async () => {
      const res = await request(app).get("/api/products/off_12345678901");
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/products/scan/:barcode", () => {
    test("returns 200 with enriched product for a known barcode", async () => {
      const res = await request(app).get(`/api/products/scan/${PRODUCT_1_BARCODE}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(PRODUCT_1_ID);
      expect(res.body.greenGrade).toBeDefined();
    });

    test("returns 400 for non-numeric barcode", async () => {
      const res = await request(app).get("/api/products/scan/NOTABARCODE");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid barcode/i);
    });

    test("returns 400 for too-short barcode (< 8 digits)", async () => {
      const res = await request(app).get("/api/products/scan/1234567");
      expect(res.status).toBe(400);
    });

    test("returns 400 for too-long barcode (> 14 digits)", async () => {
      const res = await request(app).get("/api/products/scan/123456789012345");
      expect(res.status).toBe(400);
    });

    test("returns 404 for numeric barcode not in catalog (test env skips Open Food Facts)", async () => {
      const res = await request(app).get("/api/products/scan/99999999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });
  });

  describe("GET /api/products/compare", () => {
    test("returns 200 with both products when given 2 valid ids", async () => {
      const res = await request(app).get(
        `/api/products/compare?ids=${PRODUCT_1_ID},${PRODUCT_2_ID}`
      );
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBe(2);
      for (const p of res.body.products) {
        expect(p.greenGrade).toBeDefined();
      }
    });

    test("returns 400 when ids param is missing", async () => {
      const res = await request(app).get("/api/products/compare");
      expect(res.status).toBe(400);
    });

    test("returns 400 when only 1 id is provided", async () => {
      const res = await request(app).get(`/api/products/compare?ids=${PRODUCT_1_ID}`);
      expect(res.status).toBe(400);
    });

    test("returns 400 when more than 5 ids are provided", async () => {
      const res = await request(app).get("/api/products/compare?ids=1,2,3,4,5,6");
      expect(res.status).toBe(400);
    });

    test("returns 400 when an id contains special characters", async () => {
      const res = await request(app).get("/api/products/compare?ids=1,bad@id");
      expect(res.status).toBe(400);
    });

    test("returns 404 when fewer than 2 valid products are found", async () => {
      const res = await request(app).get("/api/products/compare?ids=zzz99999,zzz88888");
      expect(res.status).toBe(404);
    });
  });
});
