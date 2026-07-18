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

    test("should return user profile with valid token", async () => {
      const email = `me-${uid()}@example.com`;
      const regRes = await request(app).post("/api/auth/register").send({
        name: "Me Tester",
        email,
        password: "MePass123",
      });
      const token = regRes.body.token;

      const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(email);
      expect(res.body.user.name).toBeDefined();
      expect(res.body.user.password_hash).toBeUndefined();
    });
  });

  describe("POST /api/auth/logout", () => {
    test("should clear the auth cookie and return success", async () => {
      const res = await request(app).post("/api/auth/logout");
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/logged out/i);
    });
  });

  describe("POST /api/auth/refresh", () => {
    test("should return 401 without a token", async () => {
      const res = await request(app).post("/api/auth/refresh");
      expect(res.status).toBe(401);
    });

    test("should return 401 with an invalid token", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .set("Authorization", "Bearer not-a-real-token");
      expect(res.status).toBe(401);
    });

    test("should issue a new token from a valid token", async () => {
      const email = `refresh-${uid()}@example.com`;
      const regRes = await request(app).post("/api/auth/register").send({
        name: "Refresh User",
        email,
        password: "RefreshPass1",
      });
      const token = regRes.body.token;

      const res = await request(app)
        .post("/api/auth/refresh")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(typeof res.body.token).toBe("string");
    });
  });

  describe("GET /api/auth/csrf", () => {
    test("should return a CSRF token", async () => {
      const res = await request(app).get("/api/auth/csrf");
      expect(res.status).toBe(200);
      expect(res.body.csrfToken).toBeDefined();
      expect(typeof res.body.csrfToken).toBe("string");
      expect(res.body.csrfToken.length).toBeGreaterThan(0);
    });

    test("should return a different token on each call", async () => {
      const res1 = await request(app).get("/api/auth/csrf");
      const res2 = await request(app).get("/api/auth/csrf");
      expect(res1.body.csrfToken).not.toBe(res2.body.csrfToken);
    });
  });

  describe("PATCH /api/auth/me", () => {
    let token;

    beforeAll(async () => {
      const email = `patch-me-${uid()}@example.com`;
      const res = await request(app).post("/api/auth/register").send({
        name: "Original Name",
        email,
        password: "PatchMePass1",
      });
      token = res.body.token;
    });

    test("should return 401 without a token", async () => {
      const res = await request(app).patch("/api/auth/me").send({ name: "New" });
      expect(res.status).toBe(401);
    });

    test("should return 400 when no updatable fields are provided", async () => {
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

    test("should require currentPassword to change password", async () => {
      const res = await request(app)
        .patch("/api/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ newPassword: "NewPass123" });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/currentPassword/i);
    });

    test("should reject incorrect currentPassword", async () => {
      const res = await request(app)
        .patch("/api/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "WrongPass1", newPassword: "NewPass123" });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/incorrect/i);
    });

    test("should reject a weak new password", async () => {
      const res = await request(app)
        .patch("/api/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "PatchMePass1", newPassword: "weak" });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/8 characters/i);
    });

    test("should update password with correct currentPassword", async () => {
      const email = `chgpwd-${uid()}@example.com`;
      const regRes = await request(app).post("/api/auth/register").send({
        name: "Change Pwd",
        email,
        password: "OldPass123",
      });
      const tok = regRes.body.token;

      const patchRes = await request(app)
        .patch("/api/auth/me")
        .set("Authorization", `Bearer ${tok}`)
        .send({ currentPassword: "OldPass123", newPassword: "NewPass456" });
      expect(patchRes.status).toBe(200);

      // Verify login works with new password
      const loginRes = await request(app).post("/api/auth/login").send({
        email,
        password: "NewPass456",
      });
      expect(loginRes.status).toBe(200);
    });
  });
});
