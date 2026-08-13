const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

// Register a regular user and an admin, return tokens for both.
async function setupUsers() {
  const uid = () => Math.random().toString(36).slice(2, 10);
  const adminEmail = `admin_prod_${uid()}@test.com`;
  const userEmail = `user_prod_${uid()}@test.com`;

  // Register admin
  await request(app).post("/api/auth/register").send({
    name: "Prod Admin",
    email: adminEmail,
    password: "AdminPass1!",
  });

  // Promote to admin directly via DB
  const { getDb } = require("../src/db/schema");
  getDb()
    .prepare("UPDATE users SET role = 'admin' WHERE email = ?")
    .run(adminEmail);

  const adminLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: adminEmail, password: "AdminPass1!" });
  const adminCsrfRes = await request(app)
    .get("/api/auth/csrf")
    .set("Cookie", adminLogin.headers["set-cookie"]);
  const adminToken = adminCsrfRes.body.csrfToken;

  // Register regular user
  await request(app).post("/api/auth/register").send({
    name: "Regular User",
    email: userEmail,
    password: "UserPass1!",
  });
  const userLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: userEmail, password: "UserPass1!" });
  const userCsrfRes = await request(app)
    .get("/api/auth/csrf")
    .set("Cookie", userLogin.headers["set-cookie"]);
  const userToken = userCsrfRes.body.csrfToken;

  return {
    adminCookies: adminLogin.headers["set-cookie"],
    adminCsrf: adminToken,
    userCookies: userLogin.headers["set-cookie"],
    userCsrf: userToken,
  };
}

const VALID_EMISSIONS = {
  landUseChange: 1.0,
  animalFeed: 0.5,
  farm: 2.0,
  processing: 0.3,
  transport: 0.2,
  packaging: 0.1,
  retail: 0.1,
};

describe("Admin Product CRUD", () => {
  let adminCookies, adminCsrf, userCookies, userCsrf;
  let createdProductId;

  beforeAll(async () => {
    ({ adminCookies, adminCsrf, userCookies, userCsrf } = await setupUsers());
  });

  // --- Authorization ---

  describe("GET /api/admin/products", () => {
    test("returns 401 without auth", async () => {
      const res = await request(app).get("/api/admin/products");
      expect(res.status).toBe(401);
    });

    test("returns 403 for non-admin user", async () => {
      const res = await request(app)
        .get("/api/admin/products")
        .set("Cookie", userCookies)
        .set("X-CSRF-Token", userCsrf);
      expect(res.status).toBe(403);
    });

    test("returns catalog list for admin", async () => {
      const res = await request(app)
        .get("/api/admin/products")
        .set("Cookie", adminCookies)
        .set("X-CSRF-Token", adminCsrf);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBeGreaterThan(0);
      expect(res.body.total).toBe(res.body.products.length);
    });

    test("includes inactive products when includeInactive=true", async () => {
      const active = await request(app)
        .get("/api/admin/products")
        .set("Cookie", adminCookies)
        .set("X-CSRF-Token", adminCsrf);
      const all = await request(app)
        .get("/api/admin/products?includeInactive=true")
        .set("Cookie", adminCookies)
        .set("X-CSRF-Token", adminCsrf);
      // After setup both may be equal; we just check both succeed
      expect(all.status).toBe(200);
      expect(all.body.total).toBeGreaterThanOrEqual(active.body.total);
    });
  });

  // --- Create ---

  describe("POST /api/admin/products", () => {
    test("returns 401 without auth", async () => {
      const res = await request(app).post("/api/admin/products").send({
        name: "Test Product",
        brand: "Test Brand",
        category: "Grains",
        emissions: VALID_EMISSIONS,
      });
      expect(res.status).toBe(401);
    });

    test("returns 403 for non-admin", async () => {
      const res = await request(app)
        .post("/api/admin/products")
        .set("Cookie", userCookies)
        .set("X-CSRF-Token", userCsrf)
        .send({ name: "X", brand: "Y", category: "Grains", emissions: VALID_EMISSIONS });
      expect(res.status).toBe(403);
    });

    test("returns 400 when emissions missing", async () => {
      const res = await request(app)
        .post("/api/admin/products")
        .set("Cookie", adminCookies)
        .set("X-CSRF-Token", adminCsrf)
        .send({ name: "No Emissions", brand: "Brand", category: "Grains" });
      expect(res.status).toBe(400);
    });

    test("returns 400 when an emission key is negative", async () => {
      const res = await request(app)
        .post("/api/admin/products")
        .set("Cookie", adminCookies)
        .set("X-CSRF-Token", adminCsrf)
        .send({
          name: "Bad Emissions",
          brand: "Brand",
          category: "Grains",
          emissions: { ...VALID_EMISSIONS, farm: -1 },
        });
      expect(res.status).toBe(400);
    });

    test("creates a new product and returns it with greenGrade", async () => {
      const res = await request(app)
        .post("/api/admin/products")
        .set("Cookie", adminCookies)
        .set("X-CSRF-Token", adminCsrf)
        .send({
          name: "Admin Test Grain",
          brand: "Test Brand",
          category: "Grains",
          description: "Created via admin API",
          emissions: VALID_EMISSIONS,
        });
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe("Admin Test Grain");
      expect(res.body.brand).toBe("Test Brand");
      expect(res.body.greenGrade).toBeDefined();
      expect(typeof res.body.greenGrade.score).toBe("number");
      createdProductId = res.body.id;
    });

    test("new product appears in public catalog", async () => {
      const res = await request(app).get("/api/products/" + createdProductId);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdProductId);
      expect(res.body.name).toBe("Admin Test Grain");
    });
  });

  // --- Update ---

  describe("PATCH /api/admin/products/:id", () => {
    test("returns 401 without auth", async () => {
      const res = await request(app)
        .patch("/api/admin/products/1")
        .send({ name: "Changed" });
      expect(res.status).toBe(401);
    });

    test("returns 403 for non-admin", async () => {
      const res = await request(app)
        .patch("/api/admin/products/1")
        .set("Cookie", userCookies)
        .set("X-CSRF-Token", userCsrf)
        .send({ name: "Changed" });
      expect(res.status).toBe(403);
    });

    test("returns 404 for non-existent product", async () => {
      const res = await request(app)
        .patch("/api/admin/products/nonexistent99")
        .set("Cookie", adminCookies)
        .set("X-CSRF-Token", adminCsrf)
        .send({ name: "Changed" });
      expect(res.status).toBe(404);
    });

    test("updates name and returns enriched product", async () => {
      const res = await request(app)
        .patch("/api/admin/products/" + createdProductId)
        .set("Cookie", adminCookies)
        .set("X-CSRF-Token", adminCsrf)
        .send({ name: "Updated Grain Name" });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated Grain Name");
      expect(res.body.brand).toBe("Test Brand"); // unchanged
      expect(res.body.greenGrade).toBeDefined();
    });

    test("updates emissions and recalculates score", async () => {
      const higherEmissions = {
        landUseChange: 10,
        animalFeed: 8,
        farm: 15,
        processing: 2,
        transport: 1.5,
        packaging: 1,
        retail: 0.5,
      };
      const before = await request(app).get("/api/products/" + createdProductId);
      const res = await request(app)
        .patch("/api/admin/products/" + createdProductId)
        .set("Cookie", adminCookies)
        .set("X-CSRF-Token", adminCsrf)
        .send({ emissions: higherEmissions });
      expect(res.status).toBe(200);
      expect(res.body.greenGrade.score).toBeLessThan(before.body.greenGrade.score);
    });

    test("change is reflected in public catalog immediately", async () => {
      await request(app)
        .patch("/api/admin/products/" + createdProductId)
        .set("Cookie", adminCookies)
        .set("X-CSRF-Token", adminCsrf)
        .send({ description: "Live-updated description" });
      const res = await request(app).get("/api/products/" + createdProductId);
      expect(res.status).toBe(200);
      expect(res.body.description).toBe("Live-updated description");
    });
  });

  // --- Soft delete ---

  describe("DELETE /api/admin/products/:id", () => {
    let deleteTargetId;

    beforeAll(async () => {
      // Create a disposable product to delete
      const res = await request(app)
        .post("/api/admin/products")
        .set("Cookie", adminCookies)
        .set("X-CSRF-Token", adminCsrf)
        .send({
          name: "To Be Deleted",
          brand: "Brand",
          category: "Snacks",
          emissions: VALID_EMISSIONS,
        });
      deleteTargetId = res.body.id;
    });

    test("returns 401 without auth", async () => {
      const res = await request(app).delete("/api/admin/products/" + deleteTargetId);
      expect(res.status).toBe(401);
    });

    test("returns 403 for non-admin", async () => {
      const res = await request(app)
        .delete("/api/admin/products/" + deleteTargetId)
        .set("Cookie", userCookies)
        .set("X-CSRF-Token", userCsrf);
      expect(res.status).toBe(403);
    });

    test("soft-deletes the product", async () => {
      const res = await request(app)
        .delete("/api/admin/products/" + deleteTargetId)
        .set("Cookie", adminCookies)
        .set("X-CSRF-Token", adminCsrf);
      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(true);
    });

    test("deleted product no longer appears in public catalog", async () => {
      const res = await request(app).get("/api/products/" + deleteTargetId);
      expect(res.status).toBe(404);
    });

    test("returns 404 on second delete of same product", async () => {
      const res = await request(app)
        .delete("/api/admin/products/" + deleteTargetId)
        .set("Cookie", adminCookies)
        .set("X-CSRF-Token", adminCsrf);
      expect(res.status).toBe(404);
    });

    test("deleted product visible in admin list with includeInactive=true", async () => {
      const res = await request(app)
        .get("/api/admin/products?includeInactive=true")
        .set("Cookie", adminCookies)
        .set("X-CSRF-Token", adminCsrf);
      const found = res.body.products.find((p) => p.id === deleteTargetId);
      expect(found).toBeDefined();
      expect(found.is_active).toBe(0);
    });
  });
});
