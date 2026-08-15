const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("GET /api/v1/export/catalog", () => {
  test("returns JSON catalog with metadata and products array by default", async () => {
    const res = await request(app).get("/api/v1/export/catalog");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body.metadata).toBeDefined();
    expect(res.body.metadata.methodology_version).toBe("3.0");
    expect(res.body.metadata.catalog_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(typeof res.body.metadata.product_count).toBe("number");
    expect(res.body.metadata.product_count).toBeGreaterThan(0);
    expect(res.body.metadata.generated_at).toBeDefined();
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBe(res.body.metadata.product_count);
  });

  test("returns X-Catalog-Sha256 and X-Methodology-Version headers", async () => {
    const res = await request(app).get("/api/v1/export/catalog");
    expect(res.status).toBe(200);
    expect(res.headers["x-catalog-sha256"]).toMatch(/^[a-f0-9]{64}$/);
    expect(res.headers["x-methodology-version"]).toBe("3.0");
  });

  test("each product row has required fields", async () => {
    const res = await request(app).get("/api/v1/export/catalog");
    const product = res.body.products[0];
    expect(product.id).toBeDefined();
    expect(product.name).toBeDefined();
    expect(product.brand).toBeDefined();
    expect(product.category).toBeDefined();
    expect(typeof product.greengrade_score).toBe("number");
    expect(["green", "amber", "red"]).toContain(product.score_tier);
    expect(typeof product.total_carbon_footprint_kg_co2e).toBe("number");
    expect(product.emission_breakdown).toBeDefined();
    expect(typeof product.emission_breakdown.land_use_change).toBe("number");
    expect(typeof product.emission_breakdown.farm_operations).toBe("number");
  });

  test("catalog hash is stable across requests", async () => {
    const r1 = await request(app).get("/api/v1/export/catalog");
    const r2 = await request(app).get("/api/v1/export/catalog");
    expect(r1.headers["x-catalog-sha256"]).toBe(r2.headers["x-catalog-sha256"]);
  });

  test("filters by category", async () => {
    const jsonRes = await request(app).get("/api/v1/export/catalog");
    const categories = [...new Set(jsonRes.body.products.map((p) => p.category))];
    if (categories.length === 0) return;

    const cat = categories[0];
    const res = await request(app).get(
      `/api/v1/export/catalog?category=${encodeURIComponent(cat)}`
    );
    expect(res.status).toBe(200);
    expect(res.body.products.every((p) => p.category.toLowerCase() === cat.toLowerCase())).toBe(
      true
    );
    expect(res.body.metadata.filters.category).toBeTruthy();
  });

  test("filters by tier=green returns only green products", async () => {
    const res = await request(app).get("/api/v1/export/catalog?tier=green");
    expect(res.status).toBe(200);
    expect(res.body.products.every((p) => p.score_tier === "green")).toBe(true);
    expect(res.body.metadata.filters.tier).toBe("green");
  });

  test("filters by tier=red returns only red products", async () => {
    const res = await request(app).get("/api/v1/export/catalog?tier=red");
    expect(res.status).toBe(200);
    expect(res.body.products.every((p) => p.score_tier === "red")).toBe(true);
  });

  test("invalid tier value is ignored (returns all products)", async () => {
    const full = await request(app).get("/api/v1/export/catalog");
    const res = await request(app).get("/api/v1/export/catalog?tier=invalid");
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(full.body.products.length);
    expect(res.body.metadata.filters.tier).toBeNull();
  });

  test("returns CSV when format=csv", async () => {
    const res = await request(app).get("/api/v1/export/catalog?format=csv");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    expect(res.headers["content-disposition"]).toMatch(/consciobite-catalog\.csv/);
    expect(typeof res.text).toBe("string");
    expect(res.text).toContain("GreenGrade Score");
    expect(res.text).toContain("Methodology Version");
  });

  test("CSV includes correct number of data rows", async () => {
    const jsonRes = await request(app).get("/api/v1/export/catalog");
    const csvRes = await request(app).get("/api/v1/export/catalog?format=csv");
    const lines = csvRes.text.trim().split("\r\n");
    // +1 for header row
    expect(lines.length).toBe(jsonRes.body.metadata.product_count + 1);
  });

  test("CSV tier filter works", async () => {
    const res = await request(app).get("/api/v1/export/catalog?format=csv&tier=green");
    expect(res.status).toBe(200);
    const lines = res.text.trim().split("\r\n");
    // Every data row (skip header) should have score_tier = green (column index 5)
    lines.slice(1).forEach((line) => {
      const cols = line.split(",");
      expect(cols[5]).toBe("green");
    });
  });

  test("invalid format value falls back to JSON", async () => {
    const res = await request(app).get("/api/v1/export/catalog?format=xml");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
  });
});
