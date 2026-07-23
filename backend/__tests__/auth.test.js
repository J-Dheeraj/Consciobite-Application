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

  describe("PATCH /api/auth/profile", () => {
    let token;

    beforeAll(async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Profile User",
          email: `profile-${uid()}@example.com`,
          password: "ProfilePass1",
        });
      token = res.body.token;
    });

    test("should return 401 without token", async () => {
      const res = await request(app).patch("/api/auth/profile").send({ name: "New Name" });
      expect(res.status).toBe(401);
    });

    test("should reject missing name", async () => {
      const res = await request(app)
        .patch("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(400);
    });

    test("should reject name exceeding 50 characters", async () => {
      const res = await request(app)
        .patch("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "A".repeat(51) });
      expect(res.status).toBe(400);
    });

    test("should update name successfully", async () => {
      const res = await request(app)
        .patch("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Name" });
      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe("Updated Name");
    });
  });

  describe("PATCH /api/auth/password", () => {
    let token;
    const email = `pwdchange-${uid()}@example.com`;
    const password = "OldPass1";

    beforeAll(async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "Pwd Change", email, password });
      token = res.body.token;
    });

    test("should return 401 without token", async () => {
      const res = await request(app)
        .patch("/api/auth/password")
        .send({ currentPassword: password, newPassword: "NewPass1" });
      expect(res.status).toBe(401);
    });

    test("should reject wrong current password", async () => {
      const res = await request(app)
        .patch("/api/auth/password")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "WrongOld1", newPassword: "NewPass1" });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Current password");
    });

    test("should reject weak new password", async () => {
      const res = await request(app)
        .patch("/api/auth/password")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: password, newPassword: "weak" });
      expect(res.status).toBe(400);
    });

    test("should update password successfully", async () => {
      const res = await request(app)
        .patch("/api/auth/password")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: password, newPassword: "NewPass123" });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Password updated");
    });
  });

  describe("GET /api/auth/stats", () => {
    let token;

    beforeAll(async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "Stats User", email: `stats-${uid()}@example.com`, password: "StatsPass1" });
      token = res.body.token;
    });

    test("should return 401 without token", async () => {
      const res = await request(app).get("/api/auth/stats");
      expect(res.status).toBe(401);
    });

    test("should return zero stats for new user", async () => {
      const res = await request(app).get("/api/auth/stats").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.reviews_count).toBe(0);
      expect(res.body.carbon_entries).toBe(0);
      expect(res.body.total_co2e_kg).toBe(0);
    });
  });
});
