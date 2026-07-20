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
  });

  describe("PUT /api/auth/profile", () => {
    const email = `profile-${uid()}@example.com`;
    const password = "ProfilePass1";
    let token;

    beforeAll(async () => {
      const reg = await request(app).post("/api/auth/register").send({
        name: "Profile User",
        email,
        password,
      });
      token = reg.body.token;
    });

    test("should return 401 without auth", async () => {
      const res = await request(app).put("/api/auth/profile").send({ name: "New Name" });
      expect(res.status).toBe(401);
    });

    test("should return 400 when no fields provided", async () => {
      const res = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("name or carbon_goal_kg");
    });

    test("should return 400 for empty name", async () => {
      const res = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "   " });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/non-empty/i);
    });

    test("should return 400 for name exceeding 50 characters", async () => {
      const res = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "A".repeat(51) });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/50 characters/);
    });

    test("should return 400 for invalid carbon_goal_kg", async () => {
      const res = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ carbon_goal_kg: -5 });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("carbon_goal_kg");
    });

    test("should return 400 for carbon_goal_kg exceeding 1000", async () => {
      const res = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ carbon_goal_kg: 1001 });
      expect(res.status).toBe(400);
    });

    test("should update display name", async () => {
      const res = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Name" });
      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe("Updated Name");
    });

    test("should update carbon goal", async () => {
      const res = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ carbon_goal_kg: 7.5 });
      expect(res.status).toBe(200);
      expect(res.body.user.carbon_goal_kg).toBe(7.5);
    });

    test("should update both name and carbon goal together", async () => {
      const res = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Final Name", carbon_goal_kg: 15 });
      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe("Final Name");
      expect(res.body.user.carbon_goal_kg).toBe(15);
    });

    test("GET /api/auth/me returns carbon_goal_kg after update", async () => {
      await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ carbon_goal_kg: 12 });
      const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
      expect(me.status).toBe(200);
      expect(me.body.user.carbon_goal_kg).toBe(12);
    });
  });
});
