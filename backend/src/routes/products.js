const express = require("express");
const validator = require("validator");
const router = express.Router();
const products = require("../data/products.json");
const { calculateGreenGrade } = require("../services/greengrade");

function enrichProduct(product) {
  const grade = calculateGreenGrade(product.emissions);
  return { ...product, greenGrade: grade };
}

// Sanitize a string: trim, escape HTML entities, limit length
function sanitize(str, maxLen = 100) {
  if (typeof str !== "string") return "";
  return validator.escape(validator.trim(str)).slice(0, maxLen);
}

const VALID_SORTS = ["grade_asc", "grade_desc"];

// GET /api/products - list all products with GreenGrade
router.get("/", (req, res) => {
  const search = req.query.search ? sanitize(req.query.search, 50) : "";
  const category = req.query.category ? sanitize(req.query.category, 30) : "";
  const sort = VALID_SORTS.includes(req.query.sort) ? req.query.sort : "";

  let results = products.map(enrichProduct);

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  if (category) {
    results = results.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (sort === "grade_asc") {
    results.sort((a, b) => a.greenGrade.score - b.greenGrade.score);
  } else if (sort === "grade_desc") {
    results.sort((a, b) => b.greenGrade.score - a.greenGrade.score);
  }

  res.json(results);
});

// GET /api/products/:id - single product detail
router.get("/:id", (req, res) => {
  const id = sanitize(req.params.id, 20);
  if (!validator.isAlphanumeric(id)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }
  const product = products.find((p) => p.id === id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(enrichProduct(product));
});

// GET /api/products/scan/:barcode - barcode lookup
router.get("/scan/:barcode", (req, res) => {
  const barcode = sanitize(req.params.barcode, 20);
  if (!validator.isNumeric(barcode) || barcode.length < 8 || barcode.length > 14) {
    return res.status(400).json({ error: "Invalid barcode format" });
  }
  const product = products.find((p) => p.barcode === barcode);
  if (!product) return res.status(404).json({ error: "Product not found for this barcode" });
  res.json(enrichProduct(product));
});

module.exports = router;
