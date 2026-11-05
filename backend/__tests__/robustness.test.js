const request = require("supertest");
process.env.NODE_ENV = "test";
const app = require("../src/index");

// A single unauthenticated request with a non-string email used to crash the
// process: validator.normalizeEmail(123) throws, and Express 4 does not catch
// a rejection from an async handler.
describe("Non-string auth input cannot crash the process", () => {
  const BAD = [123, true, null, { a: 1 }, ["x"]];

  test.each(BAD)("POST /api/auth/login rejects email=%p with 400", async (email) => {
    const res = await request(app).post("/api/auth/login").send({ email, password: "x" });
    expect(res.status).toBe(400);
  });

  test.each(BAD)("POST /api/auth/login rejects password=%p with 400", async (password) => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@example.com", password });
    expect(res.status).toBe(400);
  });

  test.each(BAD)("POST /api/auth/register rejects email=%p with 400", async (email) => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, name: "n", password: "ValidPass1" });
    expect(res.status).toBe(400);
  });

  test("server still responds after the bad requests", async () => {
    const res = await request(app).get("/api/health/live");
    expect(res.status).toBe(200);
  });
});

describe("Cache pressure does not 500 cacheable GETs", () => {
  // node-cache throws ECACHEFULL past maxKeys; the key space is the request
  // URL, so an unguarded set() turned ~1000 crafted GETs into a read outage.
  test("many distinct search keys keep returning 200", async () => {
    for (let i = 0; i < 60; i++) {
      await request(app).get(`/api/products?search=probe${i}&limit=1`);
    }
    const res = await request(app).get("/api/products/stats");
    expect(res.status).toBe(200);
  });
});

// An oversized body is a client error, but it used to reach the global error
// handler, which answered 500 and logged a full stack trace as "Unhandled
// error". Any unauthenticated caller could flood the logs that way.
describe("Body parser errors are answered as client errors", () => {
  test("oversized JSON body returns 413, not 500", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ email: "a@b.com", password: "x".repeat(20000) }));
    expect(res.status).toBe(413);
    expect(res.body.error).toBe("Request body too large");
  });

  test("malformed JSON body still returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{not json");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid JSON in request body");
  });
});
