const request = require("supertest");
process.env.NODE_ENV = "test";
const app = require("../src/index");

// The general /api limiter allows 200 requests per 15 minutes per IP. Render's
// health checker used to count against it, got a 429, and Render then treated a
// healthy instance as failed. Health checks must never be rate limited.
describe("Health checks are not rate limited", () => {
  const OVER_LIMIT = 250;

  test("liveness keeps answering 200 past the API limit", async () => {
    for (let i = 0; i < OVER_LIMIT; i++) {
      const res = await request(app).get("/api/health/live");
      expect(res.status).toBe(200);
    }
  });

  test("readiness keeps answering past the API limit", async () => {
    for (let i = 0; i < OVER_LIMIT; i++) {
      const res = await request(app).get("/api/health");
      expect(res.status).not.toBe(429);
    }
  });

  test("health checks did not use up the budget for other routes", async () => {
    const res = await request(app).get("/api/methodology");
    expect(res.status).toBe(200);
    expect(Number(res.headers["ratelimit-remaining"])).toBe(199);
  });

  test("other /api routes are still rate limited", async () => {
    let last;
    for (let i = 0; i < 200; i++) {
      last = await request(app).get("/api/methodology");
    }
    expect(last.status).toBe(429);
  });
});
