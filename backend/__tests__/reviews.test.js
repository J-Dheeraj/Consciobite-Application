const request = require("supertest");
const { randomUUID } = require("crypto");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Review endpoints", () => {
  let authToken;
  let userId;
  const email = `reviewer-${randomUUID().slice(0, 8)}@example.com`;

  beforeAll(async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Reviewer",
      email,
      password: "ReviewPass1",
    });
    authToken = res.body.token;
    userId = res.body.user.id;
  });

  describe("GET /api/reviews/:productId", () => {
    test("should return reviews for a product", async () => {
      const res = await request(app).get("/api/reviews/1");
      expect(res.status).toBe(200);
      expect(res.body.reviews).toBeDefined();
      expect(Array.isArray(res.body.reviews)).toBe(true);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats).toHaveProperty("count");
      expect(res.body.stats).toHaveProperty("average");
    });

    test("should return empty array for product with no reviews", async () => {
      const res = await request(app).get("/api/reviews/nonexistent999");
      expect(res.status).toBe(200);
      expect(res.body.reviews).toHaveLength(0);
      expect(res.body.stats.count).toBe(0);
    });
  });

  describe("POST /api/reviews/:productId", () => {
    test("should require authentication", async () => {
      const res = await request(app).post("/api/reviews/1").send({ rating: 4, comment: "Great!" });
      expect(res.status).toBe(401);
    });

    test("should reject invalid rating", async () => {
      const res = await request(app)
        .post("/api/reviews/1")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ rating: 6, comment: "Invalid" });
      expect(res.status).toBe(400);
    });

    test("should reject rating below 1", async () => {
      const res = await request(app)
        .post("/api/reviews/1")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ rating: 0, comment: "Invalid" });
      expect(res.status).toBe(400);
    });

    test("should create a review successfully", async () => {
      const productId = `test-product-${randomUUID().slice(0, 8)}`;
      const res = await request(app)
        .post(`/api/reviews/${productId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ rating: 5, comment: "Excellent product!" });
      expect(res.status).toBe(201);
      expect(res.body.review).toBeDefined();
      expect(res.body.review.rating).toBe(5);
      expect(res.body.review.user_name).toBe("Reviewer");
    });

    test("should reject duplicate review", async () => {
      const productId = `dup-product-${randomUUID().slice(0, 8)}`;
      await request(app)
        .post(`/api/reviews/${productId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ rating: 4, comment: "First" });

      const res = await request(app)
        .post(`/api/reviews/${productId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ rating: 3, comment: "Second" });
      expect(res.status).toBe(409);
    });
  });

  describe("DELETE /api/reviews/:reviewId", () => {
    test("should require authentication", async () => {
      const res = await request(app).delete("/api/reviews/someid");
      expect(res.status).toBe(401);
    });

    test("should return 404 for non-existent review", async () => {
      const res = await request(app)
        .delete("/api/reviews/nonexistent")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });

    test("should delete own review", async () => {
      const productId = `del-product-${randomUUID().slice(0, 8)}`;
      const createRes = await request(app)
        .post(`/api/reviews/${productId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ rating: 3, comment: "To delete" });

      const reviewId = createRes.body.review.id;
      const res = await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Review deleted");
    });
  });
});
