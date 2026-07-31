const request = require("supertest");
const { randomUUID } = require("crypto");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Favorites endpoints", () => {
  let authToken;
  const email = `fav-${randomUUID().slice(0, 8)}@example.com`;

  beforeAll(async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Fav Tester",
      email,
      password: "FavPass1!",
    });
    authToken = res.body.token;
  });

  describe("GET /api/favorites", () => {
    test("should require authentication", async () => {
      const res = await request(app).get("/api/favorites");
      expect(res.status).toBe(401);
    });

    test("should return empty array for new user", async () => {
      const res = await request(app)
        .get("/api/favorites")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.favorites).toEqual([]);
    });
  });

  describe("POST /api/favorites", () => {
    test("should require authentication", async () => {
      const res = await request(app).post("/api/favorites").send({ productId: "1" });
      expect(res.status).toBe(401);
    });

    test("should reject missing productId", async () => {
      const res = await request(app)
        .post("/api/favorites")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    test("should add a product to favorites", async () => {
      const res = await request(app)
        .post("/api/favorites")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ productId: "42" });
      expect(res.status).toBe(201);
      expect(res.body.favorite.productId).toBe("42");
    });

    test("should return 409 on duplicate", async () => {
      await request(app)
        .post("/api/favorites")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ productId: "dup-test" });
      const res = await request(app)
        .post("/api/favorites")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ productId: "dup-test" });
      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already/i);
    });
  });

  describe("GET /api/favorites after adding", () => {
    test("should list added favorites", async () => {
      const res = await request(app)
        .get("/api/favorites")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.favorites).toContain("42");
    });

    test("should not contain favorites from other users", async () => {
      const otherEmail = `other-${randomUUID().slice(0, 8)}@example.com`;
      const regRes = await request(app).post("/api/auth/register").send({
        name: "Other User",
        email: otherEmail,
        password: "OtherPass1!",
      });
      const otherToken = regRes.body.token;
      await request(app)
        .post("/api/favorites")
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ productId: "999" });

      const res = await request(app)
        .get("/api/favorites")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.body.favorites).not.toContain("999");
    });
  });

  describe("DELETE /api/favorites/:productId", () => {
    test("should require authentication", async () => {
      const res = await request(app).delete("/api/favorites/42");
      expect(res.status).toBe(401);
    });

    test("should remove a specific favorite", async () => {
      await request(app)
        .post("/api/favorites")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ productId: "to-remove" });
      const res = await request(app)
        .delete("/api/favorites/to-remove")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(true);
    });

    test("should return 404 for non-existent favorite", async () => {
      const res = await request(app)
        .delete("/api/favorites/does-not-exist")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/favorites/all", () => {
    test("should require authentication", async () => {
      const res = await request(app).delete("/api/favorites/all");
      expect(res.status).toBe(401);
    });

    test("should clear all favorites and return count", async () => {
      await request(app)
        .post("/api/favorites")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ productId: "clear-a" });
      await request(app)
        .post("/api/favorites")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ productId: "clear-b" });

      const clearRes = await request(app)
        .delete("/api/favorites/all")
        .set("Authorization", `Bearer ${authToken}`);
      expect(clearRes.status).toBe(200);
      expect(typeof clearRes.body.deleted).toBe("number");

      const listRes = await request(app)
        .get("/api/favorites")
        .set("Authorization", `Bearer ${authToken}`);
      expect(listRes.body.favorites).toHaveLength(0);
    });
  });
});
