const { calculateGreenGrade, getColor } = require("../src/services/greengrade");

describe("GreenGrade Algorithm", () => {
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
