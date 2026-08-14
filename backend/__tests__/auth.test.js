const request = require("supertest");
const { randomUUID } = require("crypto");

process.env.NODE_ENV = "test";
const app = require("../src/index");

const uid = () => randomUUID().slice(0, 8);

describe("Auth endpoints - validation", () => {
  describe("POST /api/auth/register", () => {
    test("should reject missing fields", async () => {
      const res = await request(app).post("/api/auth/register").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("required");
    });

    test("should reject invalid email", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test",
        email: "not-an-email",
        password: "ValidPass1",
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("email");
    });

    test("should reject weak password - too short", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test",
          email: `weakpwd-${uid()}@example.com`,
          password: "Ab1",
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("8 characters");
    });

    test("should reject password without uppercase", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test",
          email: `nouppercase-${uid()}@example.com`,
          password: "lowercase1",
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("uppercase");
    });

    test("should reject password without number", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test",
          email: `nonum-${uid()}@example.com`,
          password: "NoNumberHere",
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("number");
    });

    test("should create user with valid strong password", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Strong Pwd User",
          email: `strongpwd-${uid()}@example.com`,
          password: "StrongPass1",
        });
      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.token).toBeDefined();
    });
  });

  describe("POST /api/auth/login", () => {
    const email = `logintest-${uid()}@example.com`;
    const password = "LoginPass1";

    beforeAll(async () => {
      await request(app).post("/api/auth/register").send({
        name: "Login Test",
        email,
        password,
      });
    });

    test("should reject missing fields", async () => {
      const res = await request(app).post("/api/auth/login").send({});
      expect(res.status).toBe(400);
    });

    test("should reject wrong password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email,
        password: "WrongPass1",
      });
      expect(res.status).toBe(401);
    });

    test("should reject non-existent email", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "nobody@example.com",
        password: "SomePass1",
      });
      expect(res.status).toBe(401);
    });

    test("should authenticate with correct credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email,
        password,
      });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(email);
    });
  });

  describe("GET /api/auth/me", () => {
    test("should return 401 without token", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    test("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token");
      expect(res.status).toBe(401);
    });

    test("should return user with weeklyGoal and role when authenticated", async () => {
      const email = `me-${uid()}@example.com`;
      const regRes = await request(app).post("/api/auth/register").send({
        name: "Me Test",
        email,
        password: "MePass1Abc",
      });
      expect(regRes.status).toBe(201);

      const meRes = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${regRes.body.token}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.user.weeklyGoal).toBeDefined();
      expect(typeof meRes.body.user.weeklyGoal).toBe("number");
      expect(meRes.body.user.role).toBe("user");
    });
  });

  describe("PATCH /api/auth/me", () => {
    let token;

    beforeAll(async () => {
      const email = `patch-me-${uid()}@example.com`;
      const res = await request(app).post("/api/auth/register").send({
        name: "Original Name",
        email,
        password: "PatchPass1",
      });
      token = res.body.token;
    });

    test("should return 401 without token", async () => {
      const res = await request(app).patch("/api/auth/me").send({ name: "New Name" });
      expect(res.status).toBe(401);
    });

    test("should return 400 with no fields", async () => {
      const res = await request(app)
        .patch("/api/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(400);
    });

    test("should update name", async () => {
      const res = await request(app)
        .patch("/api/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Name" });
      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe("Updated Name");
    });

    test("should update weeklyGoal", async () => {
      const res = await request(app)
        .patch("/api/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ weeklyGoal: 15 });
      expect(res.status).toBe(200);
      expect(res.body.user.weeklyGoal).toBe(15);
    });

    test("should update both name and weeklyGoal", async () => {
      const res = await request(app)
        .patch("/api/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Final Name", weeklyGoal: 20 });
      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe("Final Name");
      expect(res.body.user.weeklyGoal).toBe(20);
    });

    test("should reject weeklyGoal below minimum", async () => {
      const res = await request(app)
        .patch("/api/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ weeklyGoal: 0 });
      expect(res.status).toBe(400);
    });

    test("should reject weeklyGoal above maximum", async () => {
      const res = await request(app)
        .patch("/api/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ weeklyGoal: 999 });
      expect(res.status).toBe(400);
    });

    test("should reject empty name", async () => {
      const res = await request(app)
        .patch("/api/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "" });
      expect(res.status).toBe(400);
    });

    test("should persist changes to GET /me", async () => {
      await request(app)
        .patch("/api/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Persisted Name", weeklyGoal: 12 });

      const meRes = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.user.name).toBe("Persisted Name");
      expect(meRes.body.user.weeklyGoal).toBe(12);
    });
  });
});
