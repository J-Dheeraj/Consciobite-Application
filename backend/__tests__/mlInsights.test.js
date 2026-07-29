const request = require("supertest");
const app = require("../src/index");
const mlInsights = require("../src/services/mlInsights");
const products = require("../src/data/products.json");

// ─── Service unit tests ─────────────────────────────────────────────────────

describe("mlInsights service", () => {
  beforeAll(() => {
    expect(mlInsights.loadArtifacts()).toBe(true);
  });

  describe("walkTree", () => {
    test("returns leaf prediction directly", () => {
      const tree = { leaf: true, prediction: "Protein" };
      expect(mlInsights.walkTree(tree, {})).toBe("Protein");
    });

    test("follows left branch when value <= threshold", () => {
      const tree = {
        leaf: false,
        feature: "farm",
        threshold: 5,
        left: { leaf: true, prediction: "low" },
        right: { leaf: true, prediction: "high" },
      };
      expect(mlInsights.walkTree(tree, { farm: 3 })).toBe("low");
      expect(mlInsights.walkTree(tree, { farm: 5 })).toBe("low");
      expect(mlInsights.walkTree(tree, { farm: 7 })).toBe("high");
    });

    test("treats missing features as 0", () => {
      const tree = {
        leaf: false,
        feature: "transport",
        threshold: 1,
        left: { leaf: true, prediction: "zero-path" },
        right: { leaf: true, prediction: "other" },
      };
      expect(mlInsights.walkTree(tree, {})).toBe("zero-path");
    });
  });

  describe("scaleVector", () => {
    test("applies (x - mean) / scale per feature", () => {
      const scaler = { mean: [2, 10], scale: [2, 5] };
      expect(mlInsights.scaleVector({ a: 4, b: 20 }, ["a", "b"], scaler)).toEqual([1, 2]);
    });
  });

  describe("classifyCategory", () => {
    test("returns one of the catalog's real categories", () => {
      const categories = new Set(products.map((p) => p.category));
      const predicted = mlInsights.classifyCategory(products[0].emissions);
      expect(categories.has(predicted)).toBe(true);
    });
  });

  describe("estimateEmissions", () => {
    test("returns a positive number from partial logistics data", () => {
      const estimate = mlInsights.estimateEmissions({
        transport: 0.5,
        packaging: 0.3,
        retail: 0.2,
      });
      expect(typeof estimate).toBe("number");
      expect(estimate).toBeGreaterThan(0);
    });
  });

  describe("clustering", () => {
    test("getClusterSummary covers all 550 products", () => {
      const summary = mlInsights.getClusterSummary();
      expect(summary.n_clusters).toBeGreaterThanOrEqual(2);
      const total = Object.values(summary.products_per_cluster).reduce((s, c) => s + c, 0);
      expect(total).toBe(products.length);
    });

    test("getClusterForProduct returns a valid label for a real product", () => {
      const cluster = mlInsights.getClusterForProduct(products[0].id);
      expect(cluster).not.toBeNull();
      expect(typeof cluster).toBe("number");
    });

    test("getClusterForProduct returns null for unknown product", () => {
      expect(mlInsights.getClusterForProduct("does-not-exist")).toBeNull();
    });
  });

  describe("findSimilarProducts", () => {
    test("returns null for unknown product", () => {
      expect(mlInsights.findSimilarProducts("does-not-exist")).toBeNull();
    });

    test("greenerOnly results all have lower total emissions than the target", () => {
      // Pick a mid-emissions product so greener alternatives exist
      const target = products.find((p) => {
        const total = Object.values(p.emissions).reduce((s, v) => s + v, 0);
        return total > 2;
      });
      const targetTotal = Object.values(target.emissions).reduce((s, v) => s + v, 0);

      const results = mlInsights.findSimilarProducts(String(target.id), {
        k: 5,
        greenerOnly: true,
      });
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(5);
      for (const r of results) {
        expect(r.total_emissions).toBeLessThan(targetTotal);
        expect(r.product_id).not.toBe(String(target.id));
      }
    });

    test("results are sorted by descending similarity", () => {
      const results = mlInsights.findSimilarProducts(String(products[0].id), {
        k: 10,
        greenerOnly: false,
      });
      for (let i = 1; i < results.length; i++) {
        expect(results[i].similarity).toBeLessThanOrEqual(results[i - 1].similarity);
      }
    });
  });
});

// ─── Route integration tests ────────────────────────────────────────────────

describe("ML routes", () => {
  const realId = String(products[0].id);

  describe("GET /api/v1/ml/similar/:productId", () => {
    test("returns similar products for a real ID", async () => {
      const res = await request(app).get(`/api/v1/ml/similar/${realId}?k=3`);
      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(realId);
      expect(res.body.results.length).toBeLessThanOrEqual(3);
    });

    test("404s for unknown product", async () => {
      const res = await request(app).get("/api/v1/ml/similar/999999");
      expect(res.status).toBe(404);
    });

    test("rejects non-numeric k", async () => {
      const res = await request(app).get(`/api/v1/ml/similar/${realId}?k=abc`);
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v1/ml/classify", () => {
    test("predicts a category from a full emissions profile", async () => {
      const res = await request(app).post("/api/v1/ml/classify").send(products[0].emissions);
      expect(res.status).toBe(200);
      expect(typeof res.body.predicted_category).toBe("string");
      expect(res.body.advisory).toBe(true);
    });

    test("rejects non-numeric emission values", async () => {
      const res = await request(app).post("/api/v1/ml/classify").send({ farm: "high" });
      expect(res.status).toBe(400);
    });

    test("rejects empty body", async () => {
      const res = await request(app).post("/api/v1/ml/classify").send({});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v1/ml/estimate-emissions", () => {
    test("estimates total emissions from logistics stages", async () => {
      const res = await request(app)
        .post("/api/v1/ml/estimate-emissions")
        .send({ transport: 0.5, packaging: 0.3, retail: 0.2 });
      expect(res.status).toBe(200);
      expect(typeof res.body.estimated_total_emissions_kg_co2e).toBe("number");
    });

    test("rejects empty body", async () => {
      const res = await request(app).post("/api/v1/ml/estimate-emissions").send({});
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/ml/clusters", () => {
    test("returns cluster summary", async () => {
      const res = await request(app).get("/api/v1/ml/clusters");
      expect(res.status).toBe(200);
      expect(res.body.n_clusters).toBeGreaterThanOrEqual(2);
      expect(res.body.products_per_cluster).toBeDefined();
    });
  });

  describe("GET /api/v1/ml/clusters/:productId", () => {
    test("returns cluster for a real product", async () => {
      const res = await request(app).get(`/api/v1/ml/clusters/${realId}`);
      expect(res.status).toBe(200);
      expect(typeof res.body.cluster).toBe("number");
    });

    test("404s for unknown product", async () => {
      const res = await request(app).get("/api/v1/ml/clusters/999999");
      expect(res.status).toBe(404);
    });
  });
});
