const request = require("supertest");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");

process.env.NODE_ENV = "test";
const app = require("../src/index");
const { getDb } = require("../src/db/schema");

// auth.js falls back to this when JWT_SECRET is unset, which is how the suite runs.
const JWT_SECRET = process.env.JWT_SECRET || "test-only-secret";

const uid = () => randomUUID().slice(0, 8);

async function registerUser() {
  const email = `epoch-${uid()}@example.com`;
  const password = "ValidPass1";
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Epoch Test", email, password });
  expect(res.status).toBe(201);
  return { email, password, token: res.body.token, id: res.body.user.id };
}

// A token with an explicit, older `iat`, so the epoch comparison can be tested
// without waiting for the clock to cross a second.
function tokenIssuedSecondsAgo(user, seconds) {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    { id: user.id, email: user.email ?? "x@example.com", jti: randomUUID(), iat: now - seconds },
    JWT_SECRET,
    { algorithm: "HS256", expiresIn: "2h" }
  );
}

const epochOf = (id) =>
  getDb().prepare("SELECT tokens_valid_from FROM users WHERE id = ?").get(id).tokens_valid_from;

describe("Logout invalidates every outstanding token (T-11)", () => {
  test("a token issued before the logout is rejected, not only the one presented", async () => {
    const user = await registerUser();
    const older = tokenIssuedSecondsAgo(user, 60);

    const before = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${older}`);
    expect(before.status).toBe(200);

    await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${user.token}`)
      .expect(200);

    const after = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${older}`);
    expect(after.status).toBe(401);
  });

  test("logout stamps the user's token epoch", async () => {
    const user = await registerUser();
    expect(epochOf(user.id)).toBe(0);

    await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${user.token}`)
      .expect(200);

    expect(epochOf(user.id)).toBeGreaterThan(0);
  });

  test("the epoch is per-user: one logout does not touch another account", async () => {
    const a = await registerUser();
    const b = await registerUser();
    const bOlder = tokenIssuedSecondsAgo(b, 60);

    await request(app).post("/api/auth/logout").set("Authorization", `Bearer ${a.token}`);

    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${bOlder}`);
    expect(res.status).toBe(200);
    expect(epochOf(b.id)).toBe(0);
  });

  test("logging in again after logout works", async () => {
    const user = await registerUser();
    await request(app).post("/api/auth/logout").set("Authorization", `Bearer ${user.token}`);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: user.password });
    expect(login.status).toBe(200);

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
  });
});

// Revoking on refresh looks like the obvious fix for T-11 and breaks everyday
// use: session restore runs on every page load and rotates the shared cookie,
// so a second tab would revoke the first tab's token and httpClient turns that
// 401 into a full logout. Logout stamping the epoch is what closes T-11.
describe("Refresh must not revoke the token it replaces", () => {
  test("the previous token still works after a refresh", async () => {
    const user = await registerUser();

    const refreshed = await request(app)
      .post("/api/auth/refresh")
      .set("Authorization", `Bearer ${user.token}`);
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.token).not.toBe(user.token);

    const old = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${user.token}`);
    expect(old.status).toBe(200);

    const next = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${refreshed.body.token}`);
    expect(next.status).toBe(200);
  });

  test("two independent restores both yield usable tokens", async () => {
    const user = await registerUser();
    const a = await request(app)
      .post("/api/auth/refresh")
      .set("Authorization", `Bearer ${user.token}`);
    const b = await request(app)
      .post("/api/auth/refresh")
      .set("Authorization", `Bearer ${a.body.token}`);

    for (const t of [user.token, a.body.token, b.body.token]) {
      const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${t}`);
      expect(res.status).toBe(200);
    }
  });
});
