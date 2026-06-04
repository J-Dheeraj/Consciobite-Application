const request = require("supertest");
const { randomUUID } = require("crypto");

// Set test environment before requiring app
process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("API Endpoints", () => {
  describe("GET /api/health", () => {
    test("should return health status", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.service).toBe("Consciobite API");
      expect(res.body.version).toBe("2.0.0");
    });
  });

  describe("GET /api/products", () => {
    test("should return paginated products", async () => {
      const res = await request(app).get("/api/products");
      expect(res.status).toBe(200);
      expect(res.body.products).toBeDefined();
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
    });

    test("should respect limit parameter", async () => {
      const res = await request(app).get("/api/products?limit=5");
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeLessThanOrEqual(5);
    });

    test("should filter by category", async () => {
      const res = await request(app).get("/api/products?category=Fruits");
      expect(res.status).toBe(200);
      res.body.products.forEach((p) => {
        expect(p.category).toBe("Fruits");
      });
    });

    test("should search by name", async () => {
      const res = await request(app).get("/api/products?search=organic&limit=5");
      expect(res.status).toBe(200);
      expect(res.body.products).toBeDefined();
    });

    test("should sort by grade descending", async () => {
      const res = await request(app).get("/api/products?sort=grade_desc&limit=5");
      expect(res.status).toBe(200);
      const scores = res.body.products.map((p) => p.greenGrade.score);
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
      }
    });

    test("each product should have greenGrade", async () => {
      const res = await request(app).get("/api/products?limit=3");
      expect(res.status).toBe(200);
      res.body.products.forEach((p) => {
        expect(p.greenGrade).toBeDefined();
        expect(p.greenGrade.score).toBeGreaterThanOrEqual(0);
        expect(p.greenGrade.score).toBeLessThanOrEqual(10);
        expect(["green", "yellow", "red"]).toContain(p.greenGrade.color);
        expect(p.greenGrade.breakdown).toHaveLength(7);
      });
    });
  });

  describe("GET /api/products/stats", () => {
    test("should return category statistics", async () => {
      const res = await request(app).get("/api/products/stats");
      expect(res.status).toBe(200);
      expect(res.body.totalProducts).toBeGreaterThan(0);
      expect(Array.isArray(res.body.categories)).toBe(true);
      res.body.categories.forEach((cat) => {
        expect(cat).toHaveProperty("category");
        expect(cat).toHaveProperty("productCount");
        expect(cat).toHaveProperty("avgScore");
        expect(cat).toHaveProperty("avgEmissions");
      });
    });
  });

  describe("GET /api/products/:id", () => {
    test("should return 400 for invalid ID", async () => {
      const res = await request(app).get("/api/products/inv@lid!");
      expect(res.status).toBe(400);
    });

    test("should return 404 for non-existent ID", async () => {
      const res = await request(app).get("/api/products/zzzzzzzzz");
      expect(res.status).toBe(404);
    });

    // Open Food Facts fallback IDs (off_<barcode>) let ProductDetail reload
    // external products that were originally resolved via /scan/:barcode.
    test("should return 400 for off_ id with non-numeric barcode", async () => {
      const res = await request(app).get("/api/products/off_abc");
      expect(res.status).toBe(400);
    });

    test("should return 400 for off_ id with too-short barcode", async () => {
      const res = await request(app).get("/api/products/off_123");
      expect(res.status).toBe(400);
    });

    test("should return 404 for off_ id in test env (external API skipped)", async () => {
      const res = await request(app).get("/api/products/off_99999999999");
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/products/scan/:barcode", () => {
    test("should return 400 for invalid barcode format", async () => {
      const res = await request(app).get("/api/products/scan/abc");
      expect(res.status).toBe(400);
    });

    test("should return 404 for unknown barcode", async () => {
      const res = await request(app).get("/api/products/scan/99999999999");
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/products/compare", () => {
    test("should return 400 without ids parameter", async () => {
      const res = await request(app).get("/api/products/compare");
      expect(res.status).toBe(400);
    });

    test("should return 400 with less than 2 ids", async () => {
      const res = await request(app).get("/api/products/compare?ids=abc");
      expect(res.status).toBe(400);
    });
  });

  describe("Auth endpoints", () => {
    const testUser = {
      name: "Test User",
      email: `test-${randomUUID().slice(0, 8)}@example.com`,
      password: "TestPassword123",
    };
    let authToken;

    test("POST /api/auth/register should create user", async () => {
      const res = await request(app).post("/api/auth/register").send(testUser);
      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.token).toBeDefined();
      authToken = res.body.token;
    });

    test("POST /api/auth/register should return role in user object", async () => {
      const email = `role-reg-${randomUUID().slice(0, 8)}@example.com`;
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "Role Test", email, password: "TestPassword123" });
      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe("user");
    });

    test("POST /api/auth/register should reject duplicate email", async () => {
      const res = await request(app).post("/api/auth/register").send(testUser);
      expect(res.status).toBe(409);
    });

    test("POST /api/auth/login should authenticate", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: testUser.password,
      });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    test("POST /api/auth/login should return role in user object", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: testUser.password,
      });
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe("user");
    });

    test("POST /api/auth/login should reject wrong password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: "wrongpassword",
      });
      expect(res.status).toBe(401);
    });

    test("GET /api/auth/me should return user profile", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testUser.email);
    });

    test("GET /api/auth/me should return role in user object", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe("user");
    });

    test("GET /api/auth/me should reject without token", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/transparency/stats", () => {
    test("should return transparency statistics", async () => {
      const res = await request(app).get("/api/transparency/stats");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("totalChanges");
      expect(res.body).toHaveProperty("paying");
      expect(res.body).toHaveProperty("nonPaying");
      expect(res.body).toHaveProperty("productCount");
      expect(res.body).toHaveProperty("manufacturerCount");
      expect(res.body).toHaveProperty("payingCount");
    });

    test("should return correct product count", async () => {
      const res = await request(app).get("/api/transparency/stats");
      expect(res.status).toBe(200);
      expect(res.body.productCount).toBe(550);
    });

    test("should be publicly accessible without auth", async () => {
      const res = await request(app).get("/api/transparency/stats");
      expect(res.status).toBe(200);
    });

    test("should return paying stats with correct shape", async () => {
      const res = await request(app).get("/api/transparency/stats");
      expect(res.status).toBe(200);
      expect(res.body.paying).toHaveProperty("count");
      expect(res.body.paying).toHaveProperty("avgDelta");
      expect(res.body.paying).toHaveProperty("increases");
      expect(res.body.paying).toHaveProperty("decreases");
    });
  });

  describe("Recipe endpoints", () => {
    test("GET /api/recipes should return recipes", async () => {
      const res = await request(app).get("/api/recipes");
      expect(res.status).toBe(200);
      expect(res.body.recipes).toBeDefined();
      expect(Array.isArray(res.body.recipes)).toBe(true);
      expect(res.body.recipes.length).toBeGreaterThan(0);
    });

    test("GET /api/recipes should filter by tag", async () => {
      const res = await request(app).get("/api/recipes?tag=quick");
      expect(res.status).toBe(200);
      res.body.recipes.forEach((r) => {
        expect(r.tags).toContain("quick");
      });
    });

    test("each recipe should have sustainability score", async () => {
      const res = await request(app).get("/api/recipes");
      res.body.recipes.forEach((r) => {
        expect(r.sustainabilityScore).toBeGreaterThanOrEqual(0);
        expect(r.ingredients).toBeDefined();
        expect(r.instructions).toBeDefined();
      });
    });
  });

  describe("404 handling", () => {
    test("should return 404 for unknown routes", async () => {
      const res = await request(app).get("/api/nonexistent");
      expect(res.status).toBe(404);
    });
  });
});
