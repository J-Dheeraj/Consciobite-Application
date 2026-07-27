const express = require("express");
const { getDb } = require("../db/schema");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();

const PRODUCT_ID_SCHEMA = {
  params: {
    productId: {
      required: true,
      type: "string",
      maxLength: 50,
      pattern: /^[a-zA-Z0-9_-]+$/,
      message: "Invalid product ID",
    },
  },
};

// GET /api/favorites - list authenticated user's favorited product IDs
router.get("/", requireAuth, (req, res) => {
  const db = getDb();
  const rows = db
    .prepare("SELECT product_id FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC")
    .all(req.user.id);
  res.json({ productIds: rows.map((r) => r.product_id) });
});

// POST /api/favorites/:productId - add a product to favorites
router.post("/:productId", requireAuth, validate(PRODUCT_ID_SCHEMA), (req, res) => {
  const { productId } = req.params;
  const db = getDb();

  db.prepare("INSERT OR IGNORE INTO user_favorites (user_id, product_id) VALUES (?, ?)").run(
    req.user.id,
    productId
  );

  res.status(201).json({ productId, favorited: true });
});

// DELETE /api/favorites/:productId - remove a product from favorites
router.delete("/:productId", requireAuth, validate(PRODUCT_ID_SCHEMA), (req, res) => {
  const { productId } = req.params;
  const db = getDb();

  const info = db
    .prepare("DELETE FROM user_favorites WHERE user_id = ? AND product_id = ?")
    .run(req.user.id, productId);

  if (info.changes === 0) {
    return res.status(404).json({ error: "Favorite not found" });
  }

  res.json({ productId, favorited: false });
});

module.exports = router;
