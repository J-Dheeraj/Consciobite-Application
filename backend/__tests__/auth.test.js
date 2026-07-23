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
      const res = await request(app).post("/api/auth/register").send({
        name: "Profile User",
        email,
        password,
      });
      token = res.body.token;
    });

    test("should return 401 without token", async () => {
      const res = await request(app).put("/api/auth/profile").send({ name: "New Name" });
      expect(res.status).toBe(401);
    });

    test("should reject missing name", async () => {
      const res = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(400);
    });

    test("should reject empty name", async () => {
      const res = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "" });
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

    test("should persist name change to GET /me", async () => {
      await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Persisted Name" });
      const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
      expect(me.body.user.name).toBe("Persisted Name");
    });
  });

  describe("PUT /api/auth/password", () => {
    const email = `pwdchange-${uid()}@example.com`;
    const password = "OldPass123";
    let token;

    beforeAll(async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Pwd Change User",
        email,
        password,
      });
      token = res.body.token;
    });

    test("should return 401 without token", async () => {
      const res = await request(app)
        .put("/api/auth/password")
        .send({ currentPassword: password, newPassword: "NewPass123" });
      expect(res.status).toBe(401);
    });

    test("should reject missing fields", async () => {
      const res = await request(app)
        .put("/api/auth/password")
        .set("Authorization", `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(400);
    });

    test("should reject weak new password", async () => {
      const res = await request(app)
        .put("/api/auth/password")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: password, newPassword: "weakpassword" });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/uppercase/i);
    });

    test("should reject wrong current password", async () => {
      const res = await request(app)
        .put("/api/auth/password")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "WrongPass1", newPassword: "NewPass456" });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/incorrect/i);
    });

    test("should change password with correct credentials", async () => {
      const res = await request(app)
        .put("/api/auth/password")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: password, newPassword: "NewPass456" });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/success/i);
    });

    test("should authenticate with new password after change", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email, password: "NewPass456" });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });
  });
});
