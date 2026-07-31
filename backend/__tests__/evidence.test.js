process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../src/index");

describe("GET /api/v1/evidence/sources", () => {
  test("returns the seeded evidence sources", async () => {
    const res = await request(app).get("/api/v1/evidence/sources");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
    const keys = res.body.map((s) => s.key);
    expect(keys).toContain("poore_nemecek_2018");
    expect(keys).toContain("our_world_in_data");
    expect(keys).toContain("openfoodfacts");
    expect(keys).toContain("category_estimate");
  });

  test("each source has required fields", async () => {
    const res = await request(app).get("/api/v1/evidence/sources");
    expect(res.status).toBe(200);
    res.body.forEach((s) => {
      expect(s).toHaveProperty("key");
      expect(s).toHaveProperty("title");
      expect(s).toHaveProperty("year");
      expect(s).toHaveProperty("source_type");
      expect(s).toHaveProperty("reliability");
    });
  });

  test("filters by reliability=high", async () => {
    const res = await request(app).get("/api/v1/evidence/sources?reliability=high");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach((s) => expect(s.reliability).toBe("high"));
  });

  test("filters by reliability=low", async () => {
    const res = await request(app).get("/api/v1/evidence/sources?reliability=low");
    expect(res.status).toBe(200);
    res.body.forEach((s) => expect(s.reliability).toBe("low"));
  });

  test("returns 400 for invalid reliability value", async () => {
    const res = await request(app).get("/api/v1/evidence/sources?reliability=vague");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/v1/evidence/sources/:key", () => {
  test("returns a known source by key", async () => {
    const res = await request(app).get("/api/v1/evidence/sources/poore_nemecek_2018");
    expect(res.status).toBe(200);
    expect(res.body.key).toBe("poore_nemecek_2018");
    expect(res.body.year).toBe(2018);
    expect(res.body.reliability).toBe("high");
    expect(res.body).toHaveProperty("explicitLinkCount");
    expect(typeof res.body.explicitLinkCount).toBe("number");
  });

  test("returns 404 for an unknown key", async () => {
    const res = await request(app).get("/api/v1/evidence/sources/no_such_source_xyz");
    expect(res.status).toBe(404);
  });

  test("returns 400 for a key with invalid characters", async () => {
    const res = await request(app).get("/api/v1/evidence/sources/bad key!");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/v1/evidence/product/:id", () => {
  test("returns provenance for a valid product", async () => {
    const res = await request(app).get("/api/v1/evidence/product/1");
    expect(res.status).toBe(200);
    expect(res.body.product_id).toBe("1");
    expect(res.body).toHaveProperty("product_name");
    expect(res.body).toHaveProperty("computed_provenance");
    expect(res.body.computed_provenance).toHaveProperty("dataConfidence");
    expect(res.body.computed_provenance).toHaveProperty("dataTier");
    expect(res.body.computed_provenance).toHaveProperty("sources");
    expect(Array.isArray(res.body.explicit_links)).toBe(true);
  });

  test("explicit_links is empty when no links added", async () => {
    const res = await request(app).get("/api/v1/evidence/product/1");
    expect(res.status).toBe(200);
    expect(res.body.explicit_links).toHaveLength(0);
  });

  test("returns 404 for an unknown product ID", async () => {
    const res = await request(app).get("/api/v1/evidence/product/999999");
    expect(res.status).toBe(404);
  });

  test("returns 400 for a non-numeric product ID", async () => {
    const res = await request(app).get("/api/v1/evidence/product/abc");
    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/evidence/sources (admin required)", () => {
  test("returns 401 without authentication", async () => {
    const res = await request(app).post("/api/v1/evidence/sources").send({
      key: "test_source",
      title: "Test Source",
      year: 2024,
      source_type: "peer_reviewed_lca",
      reliability: "high",
    });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/v1/evidence/product-link (admin required)", () => {
  test("returns 401 without authentication", async () => {
    const res = await request(app).post("/api/v1/evidence/product-link").send({
      product_id: "1",
      source_key: "poore_nemecek_2018",
    });
    expect(res.status).toBe(401);
  });
});
