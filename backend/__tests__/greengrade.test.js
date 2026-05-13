const {
  calculateGreenGrade,
  getColor,
  trainModel,
  sigmoidScore,
  percentileRank,
  computeStats,
  normalCdf,
  kdeCdf,
  buildKdeStats,
  mahalanobisDistance2,
  computeCentroid,
  invertMatrix,
} = require("../src/services/greengrade");

// ─── Sample data ────────────────────────────────────────────────────────────

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
    category: "Protein",
    emissions: {
      landUseChange: 1.5,
      animalFeed: 2.4,
      farm: 2.1,
      processing: 0.5,
      transport: 0.4,
      packaging: 0.3,
      retail: 0.2,
    },
  },
  {
    category: "Protein",
    emissions: {
      landUseChange: 5.0,
      animalFeed: 3.5,
      farm: 10.0,
      processing: 1.2,
      transport: 0.6,
      packaging: 0.3,
      retail: 0.3,
    },
  },
  {
    category: "Protein",
    emissions: {
      landUseChange: 0.8,
      animalFeed: 0.5,
      farm: 0.9,
      processing: 0.5,
      transport: 0.3,
      packaging: 0.2,
      retail: 0.1,
    },
  },
  {
    category: "Protein",
    emissions: {
      landUseChange: 3.5,
      animalFeed: 2.8,
      farm: 4.5,
      processing: 0.7,
      transport: 0.5,
      packaging: 0.3,
      retail: 0.2,
    },
  },
  {
    category: "Protein",
    emissions: {
      landUseChange: 7.0,
      animalFeed: 4.8,
      farm: 15.0,
      processing: 1.5,
      transport: 0.5,
      packaging: 0.4,
      retail: 0.3,
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
    category: "Vegetables",
    emissions: {
      landUseChange: 0.15,
      animalFeed: 0,
      farm: 0.4,
      processing: 0.25,
      transport: 0.25,
      packaging: 0.15,
      retail: 0.1,
    },
  },
  {
    category: "Vegetables",
    emissions: {
      landUseChange: 0.3,
      animalFeed: 0,
      farm: 0.8,
      processing: 0.35,
      transport: 0.35,
      packaging: 0.2,
      retail: 0.15,
    },
  },
  {
    category: "Vegetables",
    emissions: {
      landUseChange: 0.1,
      animalFeed: 0,
      farm: 0.2,
      processing: 0.15,
      transport: 0.2,
      packaging: 0.1,
      retail: 0.1,
    },
  },
  {
    category: "Vegetables",
    emissions: {
      landUseChange: 0.25,
      animalFeed: 0,
      farm: 0.5,
      processing: 0.3,
      transport: 0.3,
      packaging: 0.15,
      retail: 0.1,
    },
  },
  {
    category: "Vegetables",
    emissions: {
      landUseChange: 0.18,
      animalFeed: 0,
      farm: 0.45,
      processing: 0.28,
      transport: 0.28,
      packaging: 0.18,
      retail: 0.12,
    },
  },
  {
    category: "Vegetables",
    emissions: {
      landUseChange: 0.35,
      animalFeed: 0,
      farm: 0.9,
      processing: 0.4,
      transport: 0.4,
      packaging: 0.25,
      retail: 0.15,
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
    expect(lowVariance.score).toBeGreaterThan(highVariance.score);
  });
});

// ─── Anomaly detection ──────────────────────────────────────────────────────

describe("Anomaly detection (Mahalanobis distance)", () => {
  beforeAll(() => {
    trainModel(SAMPLE_PRODUCTS);
  });

  test("should include anomaly field for known categories", () => {
    const result = calculateGreenGrade(
      {
        landUseChange: 2,
        animalFeed: 1.5,
        farm: 3,
        processing: 0.6,
        transport: 0.4,
        packaging: 0.3,
        retail: 0.2,
      },
      "Protein"
    );
    expect(result.anomaly).toBeDefined();
    expect(result.anomaly).toHaveProperty("isAnomaly");
    expect(result.anomaly).toHaveProperty("distance");
    expect(result.anomaly).toHaveProperty("threshold");
    expect(typeof result.anomaly.isAnomaly).toBe("boolean");
    expect(result.anomaly.distance).toBeGreaterThanOrEqual(0);
    expect(result.anomaly.threshold).toBeGreaterThan(0);
  });

  test("should NOT flag a normal product as anomaly", () => {
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
    expect(result.anomaly.isAnomaly).toBe(false);
  });

  test("should flag an extreme outlier as anomaly", () => {
    // A "vegetable" with beef-level emissions should be anomalous
    const result = calculateGreenGrade(
      {
        landUseChange: 9,
        animalFeed: 6,
        farm: 20,
        processing: 2,
        transport: 1,
        packaging: 0.8,
        retail: 0.5,
      },
      "Vegetables"
    );
    expect(result.anomaly.isAnomaly).toBe(true);
    expect(result.anomaly.distance).toBeGreaterThan(result.anomaly.threshold);
  });

  test("anomaly distance should be higher for more extreme products", () => {
    const normal = calculateGreenGrade(
      {
        landUseChange: 0.2,
        animalFeed: 0,
        farm: 0.5,
        processing: 0.3,
        transport: 0.3,
        packaging: 0.2,
        retail: 0.1,
      },
      "Vegetables"
    );
    const extreme = calculateGreenGrade(
      {
        landUseChange: 5,
        animalFeed: 3,
        farm: 10,
        processing: 2,
        transport: 1,
        packaging: 0.8,
        retail: 0.5,
      },
      "Vegetables"
    );
    expect(extreme.anomaly.distance).toBeGreaterThan(normal.anomaly.distance);
  });

  test("should be null for unknown categories", () => {
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
    expect(result.anomaly).toBeNull();
  });
});

// ─── KDE tests ──────────────────────────────────────────────────────────────

describe("Kernel Density Estimation", () => {
  describe("normalCdf", () => {
    test("should return 0.5 at x=0", () => {
      expect(normalCdf(0)).toBeCloseTo(0.5, 4);
    });

    test("should return ~0.8413 at x=1", () => {
      expect(normalCdf(1)).toBeCloseTo(0.8413, 3);
    });

    test("should return ~0.1587 at x=-1", () => {
      expect(normalCdf(-1)).toBeCloseTo(0.1587, 3);
    });

    test("should return ~0.9772 at x=2", () => {
      expect(normalCdf(2)).toBeCloseTo(0.9772, 3);
    });

    test("should approach 0 for very negative x", () => {
      expect(normalCdf(-10)).toBe(0);
    });

    test("should approach 1 for very positive x", () => {
      expect(normalCdf(10)).toBe(1);
    });

    test("should be monotonically increasing", () => {
      let prev = normalCdf(-5);
      for (let x = -4; x <= 5; x += 0.5) {
        const curr = normalCdf(x);
        expect(curr).toBeGreaterThanOrEqual(prev);
        prev = curr;
      }
    });
  });

  describe("buildKdeStats", () => {
    test("should compute bandwidth via Silverman rule", () => {
      const stats = buildKdeStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(stats.bandwidth).toBeGreaterThan(0);
    });

    test("should floor bandwidth to 0.001", () => {
      // All identical values → zero std → bandwidth should be floored
      const stats = buildKdeStats([5, 5, 5, 5, 5]);
      expect(stats.bandwidth).toBeCloseTo(0.001, 3);
    });

    test("should include sorted array, mean, std", () => {
      const stats = buildKdeStats([3, 1, 2]);
      expect(stats.sorted).toEqual([1, 2, 3]);
      expect(stats.mean).toBe(2);
      expect(stats.std).toBeGreaterThan(0);
    });
  });

  describe("kdeCdf", () => {
    test("should return ~0.5 for the median of a symmetric distribution", () => {
      const stats = buildKdeStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const cdf = kdeCdf(stats, 5.5);
      expect(cdf).toBeGreaterThan(0.3);
      expect(cdf).toBeLessThan(0.7);
    });

    test("should return near 0 for values far below the data", () => {
      const stats = buildKdeStats([10, 11, 12, 13, 14, 15]);
      const cdf = kdeCdf(stats, -10);
      expect(cdf).toBeLessThan(0.01);
    });

    test("should return near 1 for values far above the data", () => {
      const stats = buildKdeStats([1, 2, 3, 4, 5]);
      const cdf = kdeCdf(stats, 100);
      expect(cdf).toBeGreaterThan(0.99);
    });

    test("should be monotonically increasing", () => {
      const stats = buildKdeStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      let prev = kdeCdf(stats, 0);
      for (let x = 1; x <= 11; x++) {
        const curr = kdeCdf(stats, x);
        expect(curr).toBeGreaterThanOrEqual(prev);
        prev = curr;
      }
    });

    test("KDE CDF should be smoother than raw percentile", () => {
      // With 5 data points, percentile jumps in 20% steps.
      // KDE CDF should give intermediate values.
      const stats = buildKdeStats([1, 3, 5, 7, 9]);

      // Between data points, KDE gives smooth values
      const at2 = kdeCdf(stats, 2);
      const at4 = kdeCdf(stats, 4);
      expect(at2).toBeGreaterThan(0.1);
      expect(at2).toBeLessThan(0.4);
      expect(at4).toBeGreaterThan(0.2);
      expect(at4).toBeLessThan(0.6);
    });
  });
});

// ─── Matrix / Mahalanobis helpers ───────────────────────────────────────────

describe("Matrix operations", () => {
  test("invertMatrix should invert 2x2 identity", () => {
    const I = [
      [1, 0],
      [0, 1],
    ];
    const inv = invertMatrix(I);
    expect(inv[0][0]).toBeCloseTo(1, 10);
    expect(inv[0][1]).toBeCloseTo(0, 10);
    expect(inv[1][0]).toBeCloseTo(0, 10);
    expect(inv[1][1]).toBeCloseTo(1, 10);
  });

  test("invertMatrix should invert a known 2x2 matrix", () => {
    const M = [
      [4, 7],
      [2, 6],
    ];
    const inv = invertMatrix(M);
    // Inverse of [[4,7],[2,6]] = [[0.6, -0.7],[-0.2, 0.4]]
    expect(inv[0][0]).toBeCloseTo(0.6, 4);
    expect(inv[0][1]).toBeCloseTo(-0.7, 4);
    expect(inv[1][0]).toBeCloseTo(-0.2, 4);
    expect(inv[1][1]).toBeCloseTo(0.4, 4);
  });

  test("invertMatrix should return null for singular matrix", () => {
    const M = [
      [1, 2],
      [2, 4],
    ];
    const inv = invertMatrix(M);
    expect(inv).toBeNull();
  });

  test("computeCentroid should compute mean vector", () => {
    const matrix = [
      [1, 2, 3],
      [3, 4, 5],
      [5, 6, 7],
    ];
    const c = computeCentroid(matrix);
    expect(c[0]).toBe(3);
    expect(c[1]).toBe(4);
    expect(c[2]).toBe(5);
  });

  test("mahalanobisDistance2 should return 0 at centroid", () => {
    const centroid = [3, 4];
    const covInv = [
      [1, 0],
      [0, 1],
    ]; // identity = Euclidean
    const dist = mahalanobisDistance2([3, 4], centroid, covInv);
    expect(dist).toBeCloseTo(0, 10);
  });

  test("mahalanobisDistance2 with identity covInv equals squared Euclidean", () => {
    const centroid = [0, 0];
    const covInv = [
      [1, 0],
      [0, 1],
    ];
    const dist = mahalanobisDistance2([3, 4], centroid, covInv);
    expect(dist).toBeCloseTo(25, 5); // 3² + 4² = 25
  });
});

// ─── Sigmoid ────────────────────────────────────────────────────────────────

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

// ─── Legacy helpers ─────────────────────────────────────────────────────────

describe("percentileRank (legacy)", () => {
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

describe("computeStats (legacy compat)", () => {
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

  test("should include bandwidth (KDE extension)", () => {
    const stats = computeStats([1, 2, 3, 4, 5]);
    expect(stats.bandwidth).toBeGreaterThan(0);
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
