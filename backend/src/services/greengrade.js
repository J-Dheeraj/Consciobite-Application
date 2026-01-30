/**
 * GreenGrade Algorithm
 *
 * Calculates a sustainability score (0-10) for food products based on
 * carbon emissions across seven categories:
 * - Land Use Change
 * - Animal Feed
 * - Farm
 * - Processing
 * - Transport
 * - Packaging
 * - Retail
 *
 * Score 10 = most sustainable, 0 = least sustainable.
 * Color coding: Green (7-10), Yellow (4-6.9), Red (0-3.9)
 */

// Reference max emissions (kg CO2e per kg product) used for normalization.
// Derived from published research on high-impact food products (e.g. beef).
const CATEGORY_MAX = {
  landUseChange: 12.0,
  animalFeed: 8.0,
  farm: 25.0,
  processing: 3.0,
  transport: 2.0,
  packaging: 1.5,
  retail: 1.0,
};

const CATEGORY_LABELS = {
  landUseChange: "Land Use Change",
  animalFeed: "Animal Feed",
  farm: "Farm",
  processing: "Processing",
  transport: "Transport",
  packaging: "Packaging",
  retail: "Retail",
};

function calculateGreenGrade(emissions) {
  const categories = Object.keys(CATEGORY_MAX);
  const totalMax = Object.values(CATEGORY_MAX).reduce((a, b) => a + b, 0);
  const totalEmissions = categories.reduce(
    (sum, cat) => sum + Math.min(emissions[cat] || 0, CATEGORY_MAX[cat]),
    0
  );

  // Score: 10 means zero emissions, 0 means at or above max emissions
  const score = Math.round(((1 - totalEmissions / totalMax) * 10) * 10) / 10;
  const clampedScore = Math.max(0, Math.min(10, score));

  const breakdown = categories.map((cat) => {
    const value = emissions[cat] || 0;
    const catScore =
      Math.round((1 - Math.min(value, CATEGORY_MAX[cat]) / CATEGORY_MAX[cat]) * 10 * 10) / 10;
    return {
      category: CATEGORY_LABELS[cat],
      emission: value,
      maxReference: CATEGORY_MAX[cat],
      categoryScore: Math.max(0, catScore),
    };
  });

  return {
    score: clampedScore,
    color: getColor(clampedScore),
    totalEmissions: Math.round(Object.values(emissions).reduce((a, b) => a + b, 0) * 100) / 100,
    breakdown,
  };
}

function getColor(score) {
  if (score >= 7) return "green";
  if (score >= 4) return "yellow";
  return "red";
}

module.exports = { calculateGreenGrade, getColor, CATEGORY_LABELS };
