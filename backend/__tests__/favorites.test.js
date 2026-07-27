const request = require("supertest");
const { randomUUID } = require("crypto");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Favorites endpoints", () => {
  let authToken;
  const email = `favs-${randomUUID().slice(0, 8)}@example.com`;

  beforeAll(async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Favorites Tester",
      email,
      password: "FavsPass1!",
    });
    authToken = res.body.token;
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
      expect(res.body.favoriteIds).toEqual([]);
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
      expect(res.body.favorited).toBe(true);
      expect(res.body.productId).toBe("1");
    });

    test("favorited product appears in GET list", async () => {
      const res = await request(app)
        .get("/api/favorites")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.favoriteIds).toContain("1");
    });

    test("toggling again removes the favorite", async () => {
      const res = await request(app)
        .post("/api/favorites/1")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.favorited).toBe(false);
    });

    test("removed product no longer in GET list", async () => {
      const res = await request(app)
        .get("/api/favorites")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.favoriteIds).not.toContain("1");
    });

    test("rejects productId longer than 50 chars", async () => {
      const longId = "a".repeat(51);
      const res = await request(app)
        .post(`/api/favorites/${longId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/favorites", () => {
    test("returns 401 without auth", async () => {
      const res = await request(app).delete("/api/favorites");
      expect(res.status).toBe(401);
    });

    test("clears all favorites", async () => {
      // Add two favorites first
      await request(app).post("/api/favorites/10").set("Authorization", `Bearer ${authToken}`);
      await request(app).post("/api/favorites/20").set("Authorization", `Bearer ${authToken}`);

      const listBefore = await request(app)
        .get("/api/favorites")
        .set("Authorization", `Bearer ${authToken}`);
      expect(listBefore.body.favoriteIds.length).toBeGreaterThanOrEqual(2);

      const del = await request(app)
        .delete("/api/favorites")
        .set("Authorization", `Bearer ${authToken}`);
      expect(del.status).toBe(200);
      expect(del.body.message).toBe("Favorites cleared");

      const listAfter = await request(app)
        .get("/api/favorites")
        .set("Authorization", `Bearer ${authToken}`);
      expect(listAfter.body.favoriteIds).toEqual([]);
    });
  });
});
