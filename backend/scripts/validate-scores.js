/**
 * Session 5 gate: Validate GreenGrade scores against the locked baseline.
 *
 * Run after any algorithm change. Exits non-zero if any product's score
 * drifts more than MAX_DELTA from the baseline, or if its grade changes.
 *
 * Usage: node scripts/validate-scores.js
 */

const { trainModel, calculateGreenGrade } = require("../src/services/greengrade");
const products = require("../src/data/products.json");
const baseline = require("../test/fixtures/greengrade-baseline.json");

const MAX_DELTA = 0.1;

trainModel(products);

const baselineMap = Object.fromEntries(baseline.map((b) => [b.id, b]));

let failures = 0;

for (const product of products) {
  const current = calculateGreenGrade(product.emissions, product.category, product);
  const base = baselineMap[product.id];

  if (!base) {
    console.error(`MISSING baseline for product ${product.id}`);
    failures++;
    continue;
  }

  const delta = Math.abs(current.score - base.score);

  if (delta > MAX_DELTA || current.color !== base.color) {
    console.error(
      `FAIL ${product.id} (${product.name}): ` +
        `score ${base.score.toFixed(3)} → ${current.score.toFixed(3)} ` +
        `(delta ${delta.toFixed(3)}), ` +
        `grade ${base.color} → ${current.color}`
    );
    failures++;
  }
}

if (failures > 0) {
  console.error(`\n${failures} product(s) failed parity check. Do not deploy.`);
  process.exit(1);
} else {
  console.log(`All ${products.length} products within delta ${MAX_DELTA}. Parity OK.`);
}
