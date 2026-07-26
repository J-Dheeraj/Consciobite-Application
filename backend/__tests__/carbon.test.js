const request = require("supertest");
const { randomUUID } = require("crypto");

process.env.NODE_ENV = "test";
const app = require("../src/index");

describe("Carbon tracking endpoints", () => {
  let authToken;
  const email = `carbon-${randomUUID().slice(0, 8)}@example.com`;

  beforeAll(async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Carbon Tester",
      email,
      password: "CarbonPass1",
    });
    authToken = res.body.token;
  });

  describe("POST /api/carbon/log", () => {
    test("should require authentication", async () => {
      const res = await request(app)
        .post("/api/carbon/log")
        .send({ productId: "1", productName: "Test", emissions: 2.5 });
      expect(res.status).toBe(401);
    });

    test("should reject missing fields", async () => {
      const res = await request(app)
        .post("/api/carbon/log")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    test("should log a purchase", async () => {
      const res = await request(app)
        .post("/api/carbon/log")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          productId: "1",
          productName: "Organic Bananas",
          quantity: 2,
          emissions: 1.5,
        });
      expect(res.status).toBe(201);
      expect(res.body.log).toBeDefined();
      expect(res.body.log.product_name).toBe("Organic Bananas");
      expect(res.body.log.quantity).toBe(2);
    });

    test("should clamp quantity to valid range", async () => {
      const res = await request(app)
        .post("/api/carbon/log")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          productId: "2",
          productName: "Test Product",
          quantity: 999,
          emissions: 1.0,
        });
      expect(res.status).toBe(201);
      expect(res.body.log.quantity).toBeLessThanOrEqual(100);
    });
  });

  describe("GET /api/carbon/summary", () => {
    test("should require authentication", async () => {
      const res = await request(app).get("/api/carbon/summary");
      expect(res.status).toBe(401);
    });

    test("should return carbon summary", async () => {
      const res = await request(app)
        .get("/api/carbon/summary")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.total).toBeDefined();
      expect(res.body.weekly).toBeDefined();
      expect(res.body.monthly).toBeDefined();
      expect(res.body.trend).toBeDefined();
      expect(res.body.topProducts).toBeDefined();
      expect(res.body.total.emissions).toBeGreaterThan(0);
    });
  });

  describe("GET /api/carbon/logs", () => {
    test("should require authentication", async () => {
      const res = await request(app).get("/api/carbon/logs");
      expect(res.status).toBe(401);
    });

    test("should return paginated logs", async () => {
      const res = await request(app)
        .get("/api/carbon/logs")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.logs).toBeDefined();
      expect(Array.isArray(res.body.logs)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
    });

    test("should respect pagination parameters", async () => {
      const res = await request(app)
        .get("/api/carbon/logs?page=1&limit=1")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.logs.length).toBeLessThanOrEqual(1);
    });
  });

  describe("GET /api/carbon/export", () => {
    test("should require authentication", async () => {
      const res = await request(app).get("/api/carbon/export");
      expect(res.status).toBe(401);
    });

    test("should return CSV with header row", async () => {
      const res = await request(app)
        .get("/api/carbon/export")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/text\/csv/);
      const firstLine = res.text.split("\r\n")[0];
      expect(firstLine).toBe(
        "Date,Product Name,Product ID,Quantity,Emissions per Unit (kg CO2e),Total Emissions (kg CO2e)"
      );
    });

    test("should include logged product data in CSV", async () => {
      const res = await request(app)
        .get("/api/carbon/export")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.text).toContain("Organic Bananas");
    });
  });

  describe("DELETE /api/carbon/log/:id", () => {
    test("should require authentication", async () => {
      const res = await request(app).delete("/api/carbon/log/someid");
      expect(res.status).toBe(401);
    });

    test("should return 404 for non-existent log", async () => {
      const res = await request(app)
        .delete("/api/carbon/log/nonexistent")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });

    test("should delete own log", async () => {
      const createRes = await request(app)
        .post("/api/carbon/log")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          productId: "del-test",
          productName: "To Delete",
          quantity: 1,
          emissions: 0.5,
        });

      const logId = createRes.body.log.id;
      const res = await request(app)
        .delete(`/api/carbon/log/${logId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Log deleted");
    });
  });
});
