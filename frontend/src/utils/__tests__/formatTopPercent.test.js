import { formatTopPercent } from "../formatTopPercent";

describe("formatTopPercent", () => {
  // The bug: the API sends 76 and the page computed (1 - 76) * 100.
  test("reads the API value as a 0-100 percentile", () => {
    expect(formatTopPercent(76)).toBe("Top 24%");
  });

  test("never shows Top 0% or more than Top 100%", () => {
    expect(formatTopPercent(100)).toBe("Top 1%");
    expect(formatTopPercent(0)).toBe("Top 100%");
  });

  test("returns null when there is no percentile", () => {
    expect(formatTopPercent(null)).toBeNull();
    expect(formatTopPercent(undefined)).toBeNull();
  });
});
