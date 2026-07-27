const express = require("express");
const crypto = require("crypto");
const validator = require("validator");
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
      message: "productId is required",
    },
  },
};

// GET /api/favorites — list authenticated user's favorited product IDs
router.get("/", requireAuth, (req, res) => {
  const db = getDb();
  const rows = db
    .prepare("SELECT product_id FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC")
    .all(req.user.id);
  res.json({ favoriteIds: rows.map((r) => r.product_id) });
});

// POST /api/favorites/:productId — toggle a favorite (add if absent, remove if present)
router.post("/:productId", requireAuth, validate(PRODUCT_ID_SCHEMA), (req, res) => {
  const db = getDb();
  const productId = validator.escape(req.params.productId);
  const userId = req.user.id;

  const existing = db
    .prepare("SELECT id FROM user_favorites WHERE user_id = ? AND product_id = ?")
    .get(userId, productId);

  if (existing) {
    db.prepare("DELETE FROM user_favorites WHERE id = ?").run(existing.id);
    return res.json({ favorited: false, productId });
  }

  const id = crypto.randomUUID();
  db.prepare("INSERT INTO user_favorites (id, user_id, product_id) VALUES (?, ?, ?)").run(
    id,
    userId,
    productId
  );

  res.status(201).json({ favorited: true, productId });
});

// DELETE /api/favorites — clear all favorites for the authenticated user
router.delete("/", requireAuth, (req, res) => {
  const db = getDb();
  db.prepare("DELETE FROM user_favorites WHERE user_id = ?").run(req.user.id);
  res.json({ message: "Favorites cleared" });
});

module.exports = router;
