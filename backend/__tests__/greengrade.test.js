const {
  calculateGreenGrade,
  getColor,
  trainModel,
  sigmoidScore,
  percentileRank,
  computeStats,
} = require("../src/services/greengrade");

// ─── Helper: minimal product set that covers several food categories ────────
const SAMPLE_PRODUCTS = [
  {
    category: "Protein",
    emissions: {
      landUseChange: 9.8,
      animalFeed: 6.2,
      farm: 21.3,
      processing: 1.8,
      transport: 0.5,
      packaging: 0.4,
      retail: 0.3,
    },
  },
  {
    category: "Protein",
    emissions: {
      landUseChange: 0.3,
      animalFeed: 0,
      farm: 0.5,
      processing: 0.4,
      transport: 0.2,
      packaging: 0.2,
      retail: 0.1,
    },
  },
  {
    category: "Protein",
    emissions: {
      landUseChange: 2.5,
      animalFeed: 1.8,
      farm: 1.4,
      processing: 0.6,
      transport: 0.4,
      packaging: 0.3,
      retail: 0.2,
    },
  },
  {
    category: "Vegetables",
    emissions: {
      landUseChange: 0.1,
      animalFeed: 0,
      farm: 0.3,
      processing: 0.2,
      transport: 0.2,
      packaging: 0.1,
      retail: 0.1,
    },
  },
  {
    category: "Vegetables",
    emissions: {
      landUseChange: 0.2,
      animalFeed: 0,
      farm: 0.6,
      processing: 0.3,
      transport: 0.3,
      packaging: 0.2,
      retail: 0.1,
    },
  },
  {
    category: "Dairy & Eggs",
    emissions: {
      landUseChange: 3,
      animalFeed: 2.5,
      farm: 5,
      processing: 0.8,
      transport: 0.5,
      packaging: 0.4,
      retail: 0.3,
    },
  },
];

// ─── Untrained (v1 fallback) tests ──────────────────────────────────────────

describe("GreenGrade Algorithm (untrained fallback)", () => {
  test("should return score of 10 for zero emissions", () => {
    const emissions = {
      landUseChange: 0,
      animalFeed: 0,
      farm: 0,
      processing: 0,
      transport: 0,
      packaging: 0,
      retail: 0,
    };
    const result = calculateGreenGrade(emissions);
    expect(result.score).toBe(10);
    expect(result.color).toBe("green");
    expect(result.totalEmissions).toBe(0);
  });

  test("should return score near 0 for max emissions", () => {
    const emissions = {
      landUseChange: 12,
      animalFeed: 8,
      farm: 25,
      processing: 3,
      transport: 2,
      packaging: 1.5,
      retail: 1,
    };
    const result = calculateGreenGrade(emissions);
    expect(result.score).toBe(0);
    expect(result.color).toBe("red");
  });

  test("should clamp emissions above max", () => {
    const emissions = {
      landUseChange: 100,
      animalFeed: 100,
      farm: 100,
      processing: 100,
      transport: 100,
      packaging: 100,
      retail: 100,
    };
    const result = calculateGreenGrade(emissions);
    expect(result.score).toBe(0);
  });

  test("should return 7 breakdown items", () => {
    const emissions = {
      landUseChange: 1,
      animalFeed: 0.5,
      farm: 2,
      processing: 0.3,
      transport: 0.2,
      packaging: 0.1,
      retail: 0.1,
    };
    const result = calculateGreenGrade(emissions);
    expect(result.breakdown).toHaveLength(7);
    result.breakdown.forEach((item) => {
      expect(item).toHaveProperty("category");
      expect(item).toHaveProperty("emission");
      expect(item).toHaveProperty("maxReference");
      expect(item).toHaveProperty("categoryScore");
      expect(item.categoryScore).toBeGreaterThanOrEqual(0);
      expect(item.categoryScore).toBeLessThanOrEqual(10);
    });
  });

  test("should handle missing emission categories gracefully", () => {
    const emissions = { farm: 5 };
    const result = calculateGreenGrade(emissions);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(10);
  });

  test("should calculate totalEmissions correctly", () => {
    const emissions = {
      landUseChange: 1,
      animalFeed: 2,
      farm: 3,
      processing: 0.5,
      transport: 0.3,
      packaging: 0.2,
      retail: 0.1,
    };
    const result = calculateGreenGrade(emissions);
    expect(result.totalEmissions).toBeCloseTo(7.1, 1);
  });
});

// ─── Trained model tests ────────────────────────────────────────────────────

describe("GreenGrade ML (trained model)", () => {
  beforeAll(() => {
    trainModel(SAMPLE_PRODUCTS);
  });

  test("should produce score between 0 and 10", () => {
    const result = calculateGreenGrade(
      {
        landUseChange: 1,
        animalFeed: 0.5,
        farm: 2,
        processing: 0.5,
        transport: 0.3,
        packaging: 0.2,
        retail: 0.1,
      },
      "Protein"
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10);
  });

  test("should assign higher score to lower-emission product", () => {
    const low = calculateGreenGrade(
      {
        landUseChange: 0.1,
        animalFeed: 0,
        farm: 0.3,
        processing: 0.2,
        transport: 0.2,
        packaging: 0.1,
        retail: 0.1,
      },
      "Vegetables"
    );
    const high = calculateGreenGrade(
      {
        landUseChange: 9.8,
        animalFeed: 6.2,
        farm: 21.3,
        processing: 1.8,
        transport: 0.5,
        packaging: 0.4,
        retail: 0.3,
      },
      "Protein"
    );
    expect(low.score).toBeGreaterThan(high.score);
  });

  test("should return 7 breakdown items with percentile", () => {
    const result = calculateGreenGrade(
      {
        landUseChange: 2.5,
        animalFeed: 1.8,
        farm: 1.4,
        processing: 0.6,
        transport: 0.4,
        packaging: 0.3,
        retail: 0.2,
      },
      "Protein"
    );
    expect(result.breakdown).toHaveLength(7);
    result.breakdown.forEach((item) => {
      expect(item).toHaveProperty("category");
      expect(item).toHaveProperty("emission");
      expect(item).toHaveProperty("maxReference");
      expect(item).toHaveProperty("categoryScore");
      expect(item).toHaveProperty("percentile");
      expect(item.percentile).toBeGreaterThanOrEqual(0);
      expect(item.percentile).toBeLessThanOrEqual(100);
    });
  });

  test("should include confidence field", () => {
    const result = calculateGreenGrade(
      {
        landUseChange: 0.1,
        animalFeed: 0,
        farm: 0.3,
        processing: 0.2,
        transport: 0.2,
        packaging: 0.1,
        retail: 0.1,
      },
      "Vegetables"
    );
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  test("should include global percentile", () => {
    const result = calculateGreenGrade(
      {
        landUseChange: 0.3,
        animalFeed: 0,
        farm: 0.5,
        processing: 0.4,
        transport: 0.2,
        packaging: 0.2,
        retail: 0.1,
      },
      "Protein"
    );
    expect(result.percentile).toBeGreaterThanOrEqual(0);
    expect(result.percentile).toBeLessThanOrEqual(100);
  });

  test("should include categoryRank when category is known", () => {
    const result = calculateGreenGrade(
      {
        landUseChange: 0.3,
        animalFeed: 0,
        farm: 0.5,
        processing: 0.4,
        transport: 0.2,
        packaging: 0.2,
        retail: 0.1,
      },
      "Protein"
    );
    expect(result.categoryRank).toBeGreaterThanOrEqual(0);
    expect(result.categoryRank).toBeLessThanOrEqual(100);
  });

  test("should still work for unknown category", () => {
    const result = calculateGreenGrade(
      {
        landUseChange: 1,
        animalFeed: 0.5,
        farm: 2,
        processing: 0.5,
        transport: 0.3,
        packaging: 0.2,
        retail: 0.1,
      },
      "SomeNewCategory"
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10);
    expect(result.color).toBeDefined();
  });

  test("learned weights should not be equal", () => {
    // The algorithm learns different importance for each emission dimension
    // based on variance — farm and landUseChange should weigh more than retail
    const lowVariance = calculateGreenGrade(
      {
        landUseChange: 0,
        animalFeed: 0,
        farm: 0,
        processing: 0,
        transport: 0,
        packaging: 0,
        retail: 0.5,
      },
      "Vegetables"
    );
    const highVariance = calculateGreenGrade(
      {
        landUseChange: 0,
        animalFeed: 0,
        farm: 5,
        processing: 0,
        transport: 0,
        packaging: 0,
        retail: 0,
      },
      "Vegetables"
    );
    // farm=5 should cause a much bigger score drop than retail=0.5
    expect(lowVariance.score).toBeGreaterThan(highVariance.score);
  });
});

// ─── Statistical helpers ────────────────────────────────────────────────────

describe("sigmoidScore", () => {
  test("should map 0 to 0", () => {
    expect(sigmoidScore(0)).toBeCloseTo(0, 1);
  });

  test("should map 1 to 10", () => {
    expect(sigmoidScore(1)).toBeCloseTo(10, 1);
  });

  test("should map 0.5 to ~5", () => {
    expect(sigmoidScore(0.5)).toBeCloseTo(5, 0);
  });

  test("should be monotonically increasing", () => {
    let prev = sigmoidScore(0);
    for (let x = 0.1; x <= 1; x += 0.1) {
      const curr = sigmoidScore(x);
      expect(curr).toBeGreaterThan(prev);
      prev = curr;
    }
  });
});

describe("percentileRank", () => {
  const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  test("should return 0 for value at or below minimum", () => {
    expect(percentileRank(sorted, 0)).toBe(0);
    expect(percentileRank(sorted, 1)).toBe(0);
  });

  test("should return 1 for value at or above maximum", () => {
    expect(percentileRank(sorted, 10)).toBe(1);
    expect(percentileRank(sorted, 100)).toBe(1);
  });

  test("should return ~0.5 for median value", () => {
    const rank = percentileRank(sorted, 5);
    expect(rank).toBeGreaterThan(0.3);
    expect(rank).toBeLessThan(0.7);
  });

  test("should handle empty array", () => {
    expect(percentileRank([], 5)).toBe(0.5);
  });
});

describe("computeStats", () => {
  test("should compute correct mean", () => {
    const stats = computeStats([2, 4, 6, 8, 10]);
    expect(stats.mean).toBe(6);
  });

  test("should compute correct std", () => {
    const stats = computeStats([2, 4, 6, 8, 10]);
    expect(stats.std).toBeCloseTo(2.83, 1);
  });

  test("should compute percentiles", () => {
    const stats = computeStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(stats.p25).toBe(3);
    expect(stats.p50).toBe(6);
    expect(stats.p75).toBe(8);
  });

  test("should return sorted array", () => {
    const stats = computeStats([5, 1, 3, 2, 4]);
    expect(stats.sorted).toEqual([1, 2, 3, 4, 5]);
  });
});

// ─── Color thresholds ───────────────────────────────────────────────────────

describe("getColor", () => {
  test("should return green for scores >= 7", () => {
    expect(getColor(7)).toBe("green");
    expect(getColor(10)).toBe("green");
    expect(getColor(8.5)).toBe("green");
  });

  test("should return yellow for scores 4-6.9", () => {
    expect(getColor(4)).toBe("yellow");
    expect(getColor(6.9)).toBe("yellow");
    expect(getColor(5)).toBe("yellow");
  });

  test("should return red for scores < 4", () => {
    expect(getColor(0)).toBe("red");
    expect(getColor(3.9)).toBe("red");
    expect(getColor(2)).toBe("red");
  });
});
