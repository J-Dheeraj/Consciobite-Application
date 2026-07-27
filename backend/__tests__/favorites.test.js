const request = require("supertest");
const { randomUUID } = require("crypto");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Favorites endpoints", () => {
  let authToken;
  let authToken2;
  const email = `fav-${randomUUID().slice(0, 8)}@example.com`;
  const email2 = `fav2-${randomUUID().slice(0, 8)}@example.com`;

  beforeAll(async () => {
    const res1 = await request(app).post("/api/auth/register").send({
      name: "Fav Tester",
      email,
      password: "FavPass1!",
    });
    authToken = res1.body.token;

    const res2 = await request(app).post("/api/auth/register").send({
      name: "Fav Tester 2",
      email: email2,
      password: "FavPass2!",
    });
    authToken2 = res2.body.token;
  });

  describe("GET /api/favorites", () => {
    test("returns 401 without auth", async () => {
      const res = await request(app).get("/api/favorites");
      expect(res.status).toBe(401);
    });

    test("returns empty list for new user", async () => {
      const res = await request(app)
        .get("/api/favorites")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.productIds).toEqual([]);
    });
  });

  describe("POST /api/favorites/:productId", () => {
    test("returns 401 without auth", async () => {
      const res = await request(app).post("/api/favorites/1");
      expect(res.status).toBe(401);
    });

    test("adds a product to favorites", async () => {
      const res = await request(app)
        .post("/api/favorites/1")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(201);
      expect(res.body.productId).toBe("1");
      expect(res.body.favorited).toBe(true);
    });

    test("adding same product twice is idempotent", async () => {
      await request(app).post("/api/favorites/2").set("Authorization", `Bearer ${authToken}`);
      const res = await request(app)
        .post("/api/favorites/2")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(201);
    });

    test("rejects invalid product ID characters", async () => {
      const res = await request(app)
        .post("/api/favorites/inv@lid!")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/favorites (after adds)", () => {
    test("returns favorited product IDs", async () => {
      const res = await request(app)
        .get("/api/favorites")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.productIds).toContain("1");
      expect(res.body.productIds).toContain("2");
    });

    test("favorites are user-scoped (user2 sees empty list)", async () => {
      const res = await request(app)
        .get("/api/favorites")
        .set("Authorization", `Bearer ${authToken2}`);
      expect(res.status).toBe(200);
      expect(res.body.productIds).toEqual([]);
    });
  });

  describe("DELETE /api/favorites/:productId", () => {
    test("returns 401 without auth", async () => {
      const res = await request(app).delete("/api/favorites/1");
      expect(res.status).toBe(401);
    });

    test("removes a favorited product", async () => {
      await request(app).post("/api/favorites/3").set("Authorization", `Bearer ${authToken}`);

      const res = await request(app)
        .delete("/api/favorites/3")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.favorited).toBe(false);
    });

    test("returns 404 when deleting a non-favorited product", async () => {
      const res = await request(app)
        .delete("/api/favorites/999")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });

    test("verifies product is gone after removal", async () => {
      await request(app).post("/api/favorites/4").set("Authorization", `Bearer ${authToken}`);
      await request(app).delete("/api/favorites/4").set("Authorization", `Bearer ${authToken}`);

      const res = await request(app)
        .get("/api/favorites")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.body.productIds).not.toContain("4");
    });

    test("user cannot delete another user's favorites", async () => {
      // user1 has product "1", user2 tries to delete it
      const res = await request(app)
        .delete("/api/favorites/1")
        .set("Authorization", `Bearer ${authToken2}`);
      expect(res.status).toBe(404);

      // user1's favorite is still intact
      const check = await request(app)
        .get("/api/favorites")
        .set("Authorization", `Bearer ${authToken}`);
      expect(check.body.productIds).toContain("1");
    });
  });
});
