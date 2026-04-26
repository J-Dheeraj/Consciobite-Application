/**
 * Pre-work P3: Generate GreenGrade baseline score fixtures.
 *
 * Run before any algorithm changes. Output is the acceptance test for Session 5 —
 * any future GreenGrade change must match these scores within 0.1 per product.
 *
 * Usage: node scripts/generate-baseline.js
 * Output: test/fixtures/greengrade-baseline.json
 */

const path = require("path");
const fs = require("fs");

const { trainModel, calculateGreenGrade } = require("../src/services/greengrade");
const products = require("../src/data/products.json");

trainModel(products);

const baseline = products.map((p) => {
  const grade = calculateGreenGrade(p.emissions, p.category, p);
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    score: grade.score,
    color: grade.color,
    totalEmissions: grade.totalEmissions,
  };
});

const outPath = path.join(__dirname, "../test/fixtures/greengrade-baseline.json");
fs.writeFileSync(outPath, JSON.stringify(baseline, null, 2));

console.log(`Wrote ${baseline.length} product baselines to ${outPath}`);

const byGrade = baseline.reduce((acc, p) => {
  acc[p.color] = (acc[p.color] || 0) + 1;
  return acc;
}, {});
console.log("Grade distribution:", byGrade);
console.log(
  "Score range:",
  Math.min(...baseline.map((p) => p.score)).toFixed(3),
  "–",
  Math.max(...baseline.map((p) => p.score)).toFixed(3)
);
