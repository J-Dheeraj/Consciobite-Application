/**
 * Contract between the API and the frontend's product and passport pages.
 *
 * The frontend page tests render real API responses saved under
 * frontend/src/__fixtures__/api/. This test checks those files still match
 * what the API returns today, so a backend change that alters a score, a
 * percentile or a field name fails here instead of shipping to the page.
 *
 * If a change is intended, regenerate the fixtures and review the diff:
 *   UPDATE_API_FIXTURES=1 npx jest __tests__/frontendContract.test.js
 */
const fs = require("fs");
const path = require("path");
const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../src/index");

const FIXTURE_DIR = path.join(__dirname, "..", "..", "frontend", "src", "__fixtures__", "api");
const UPDATE = process.env.UPDATE_API_FIXTURES === "1";

// Tofu scores near the top, beef at the very bottom (percentile 0), so the
// pages are tested at both ends of the percentile range.
const FIXTURE_IDS = ["12", "2"];

// Every breakdown category the product page has a label for.
const FRONTEND_BREAKDOWN_CATEGORIES = [
  "Land Use Change",
  "Animal Feed",
  "Farm",
  "Processing",
  "Transport",
  "Packaging",
  "Retail",
];

// Every emission key the passport page has a label for.
const FRONTEND_PASSPORT_DIMENSIONS = [
  "land_use_change",
  "animal_feed",
  "farm_operations",
  "processing",
  "transport",
  "packaging",
  "retail",
];

// passport_generated_at is the request time, so it can never match a saved file.
const STABLE_TIMESTAMP = "2000-01-01T00:00:00.000Z";

function readFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, name), "utf-8"));
}

function writeFixture(name, body) {
  fs.mkdirSync(FIXTURE_DIR, { recursive: true });
  fs.writeFileSync(path.join(FIXTURE_DIR, name), JSON.stringify(body, null, 2) + "\n");
}

function expectPercentile(value) {
  expect(Number.isInteger(value)).toBe(true);
  expect(value).toBeGreaterThanOrEqual(0);
  expect(value).toBeLessThanOrEqual(100);
}

describe("API contract with the frontend product and passport pages", () => {
  describe.each(FIXTURE_IDS)("product %s", (id) => {
    let product;
    let passport;

    beforeAll(async () => {
      const [p, pp] = await Promise.all([
        request(app).get(`/api/products/${id}`),
        request(app).get(`/api/v1/passport/${id}`),
      ]);
      expect(p.status).toBe(200);
      expect(pp.status).toBe(200);
      product = p.body;
      passport = { ...pp.body, passport_generated_at: STABLE_TIMESTAMP };
      if (UPDATE) {
        writeFixture(`product-${id}.json`, product);
        writeFixture(`passport-${id}.json`, passport);
      }
    });

    test("GET /api/products/:id still matches the frontend fixture", () => {
      expect(product).toEqual(readFixture(`product-${id}.json`));
    });

    test("GET /api/v1/passport/:id still matches the frontend fixture", () => {
      expect(passport).toEqual(readFixture(`passport-${id}.json`));
    });

    test("product response has every field the product page reads", () => {
      expect(typeof product.name).toBe("string");
      expect(typeof product.brand).toBe("string");
      expect(typeof product.category).toBe("string");
      const g = product.greenGrade;
      expect(typeof g.score).toBe("number");
      expect(g.score).toBeGreaterThanOrEqual(0);
      expect(g.score).toBeLessThanOrEqual(10);
      expect(typeof g.color).toBe("string");
      expect(typeof g.totalEmissions).toBe("number");
      // The page formats both as "Top N%"; a 0-1 fraction here was the
      // "Top -7500%" bug.
      expectPercentile(g.percentile);
      expectPercentile(g.categoryRank);
      expect(g.breakdown.map((b) => b.category)).toEqual(FRONTEND_BREAKDOWN_CATEGORIES);
      for (const b of g.breakdown) {
        expect(typeof b.categoryScore).toBe("number");
        expect(typeof b.emission).toBe("number");
        expect(typeof b.maxReference).toBe("number");
      }
    });

    test("passport response has every field the passport page reads", () => {
      expect(passport.product_id).toBe(id);
      expect(typeof passport.product_name).toBe("string");
      expect(typeof passport.brand).toBe("string");
      expect(typeof passport.category).toBe("string");
      expect(typeof passport.total_carbon_footprint_kg_co2e).toBe("number");
      expect(typeof passport.methodology_version).toBe("string");
      expectPercentile(passport.score_percentile);
      expect(Object.keys(passport.emission_breakdown).sort()).toEqual(
        [...FRONTEND_PASSPORT_DIMENSIONS].sort()
      );
      for (const v of Object.values(passport.emission_breakdown)) {
        expect(typeof v).toBe("number");
      }
    });

    test("product page and passport show the same score and percentile", () => {
      expect(passport.greengrade_score).toBe(product.greenGrade.score);
      expect(passport.score_percentile).toBe(product.greenGrade.percentile);
      expect(passport.total_carbon_footprint_kg_co2e).toBe(product.greenGrade.totalEmissions);
      expect(passport.product_name).toBe(product.name);
      expect(passport.brand).toBe(product.brand);
    });
  });

  test("passport_generated_at is an ISO timestamp the page can format", async () => {
    const res = await request(app).get("/api/v1/passport/12");
    expect(Number.isNaN(new Date(res.body.passport_generated_at).getTime())).toBe(false);
  });

  test("every catalog product has a 0-100 integer percentile and category rank", async () => {
    const first = await request(app).get("/api/products?limit=100&page=1");
    expect(first.status).toBe(200);
    const { totalPages, totalCount } = first.body.pagination;
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        request(app).get(`/api/products?limit=100&page=${i + 2}`)
      )
    );
    const all = [first, ...rest].flatMap((r) => r.body.products);
    expect(all.length).toBe(totalCount);
    const bad = all.filter(
      (p) =>
        !Number.isInteger(p.greenGrade.percentile) ||
        p.greenGrade.percentile < 0 ||
        p.greenGrade.percentile > 100 ||
        !Number.isInteger(p.greenGrade.categoryRank) ||
        p.greenGrade.categoryRank < 0 ||
        p.greenGrade.categoryRank > 100
    );
    expect(bad.map((p) => p.id)).toEqual([]);
  });
});
