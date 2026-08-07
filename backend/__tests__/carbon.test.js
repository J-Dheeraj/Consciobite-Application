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

    test("should return CSV content type", async () => {
      const res = await request(app)
        .get("/api/carbon/export")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/text\/csv/);
      expect(res.headers["content-disposition"]).toMatch(/attachment/);
      expect(res.headers["content-disposition"]).toMatch(/carbon-log\.csv/);
    });

    test("should include CSV header row", async () => {
      const res = await request(app)
        .get("/api/carbon/export")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.text).toMatch(/Date,Product Name,Product ID/);
    });

    test("should include logged products in CSV body", async () => {
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

  describe("GET /api/carbon/insights", () => {
    test("should require authentication", async () => {
      const res = await request(app).get("/api/carbon/insights");
      expect(res.status).toBe(401);
    });

    test("should return byCategory and swaps arrays", async () => {
      const res = await request(app)
        .get("/api/carbon/insights")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.byCategory)).toBe(true);
      expect(Array.isArray(res.body.swaps)).toBe(true);
    });

    test("should group emissions by category when logs exist", async () => {
      // Log a known product (id=1 is Firm Tofu, category=Protein)
      await request(app)
        .post("/api/carbon/log")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ productId: "1", productName: "Firm Tofu", quantity: 1, emissions: 1.7 });

      const res = await request(app)
        .get("/api/carbon/insights")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.byCategory.length).toBeGreaterThan(0);
      // Should have an emissions value
      const firstCat = res.body.byCategory[0];
      expect(typeof firstCat.category).toBe("string");
      expect(typeof firstCat.emissions).toBe("number");
      expect(firstCat.emissions).toBeGreaterThan(0);
    });

    test("byCategory should be sorted by emissions descending", async () => {
      const res = await request(app)
        .get("/api/carbon/insights")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      const cats = res.body.byCategory;
      for (let i = 1; i < cats.length; i++) {
        expect(cats[i - 1].emissions).toBeGreaterThanOrEqual(cats[i].emissions);
      }
    });

    test("swaps should have from/to/savingPerUnit shape", async () => {
      const res = await request(app)
        .get("/api/carbon/insights")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      for (const swap of res.body.swaps) {
        expect(swap.from).toBeDefined();
        expect(swap.to).toBeDefined();
        expect(typeof swap.savingPerUnit).toBe("number");
        expect(swap.savingPerUnit).toBeGreaterThan(0);
        expect(swap.to.emissions).toBeLessThan(swap.from.emissions);
      }
    });

    test("should return empty arrays for user with no logs", async () => {
      const emptyEmail = `empty-${randomUUID().slice(0, 8)}@example.com`;
      const reg = await request(app).post("/api/auth/register").send({
        name: "Empty User",
        email: emptyEmail,
        password: "EmptyPass1",
      });
      const emptyToken = reg.body.token;

      const res = await request(app)
        .get("/api/carbon/insights")
        .set("Authorization", `Bearer ${emptyToken}`);
      expect(res.status).toBe(200);
      expect(res.body.byCategory).toEqual([]);
      expect(res.body.swaps).toEqual([]);
    });
  });
});
