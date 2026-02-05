const express = require("express");
const router = express.Router();
const products = require("../data/products.json");
const { calculateGreenGrade } = require("../services/greengrade");

function enrichProduct(product) {
  const grade = calculateGreenGrade(product.emissions);
  return { ...product, greenGrade: grade };
}

// GET /api/products - list all products with GreenGrade
router.get("/", (req, res) => {
  const { search, category, sort } = req.query;
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
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(enrichProduct(product));
});

// GET /api/products/scan/:barcode - barcode lookup
router.get("/scan/:barcode", (req, res) => {
  const product = products.find((p) => p.barcode === req.params.barcode);
  if (!product) return res.status(404).json({ error: "Product not found for this barcode" });
  res.json(enrichProduct(product));
});

module.exports = router;
