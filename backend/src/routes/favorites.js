const express = require("express");
const validator = require("validator");
const { getDb } = require("../db/schema");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();

const ADD_SCHEMA = {
  body: {
    productId: {
      required: true,
      type: "string",
      maxLength: 50,
      message: "productId is required",
    },
  },
};

const REMOVE_SCHEMA = {
  params: {
    productId: {
      required: true,
      type: "string",
      maxLength: 50,
      message: "productId is required",
    },
  },
};

// GET /api/favorites — list favorite product IDs for the authenticated user
router.get("/", requireAuth, (req, res) => {
  const db = getDb();
  const rows = db
    .prepare("SELECT product_id FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC")
    .all(req.user.id);
  res.json({ favorites: rows.map((r) => r.product_id) });
});

// POST /api/favorites — add a product to favorites
router.post("/", requireAuth, validate(ADD_SCHEMA), (req, res) => {
  const db = getDb();
  const productId = validator.escape(String(req.body.productId));
  const info = db
    .prepare("INSERT OR IGNORE INTO user_favorites (user_id, product_id) VALUES (?, ?)")
    .run(req.user.id, productId);
  if (info.changes === 0) {
    return res.status(409).json({ error: "Already in favorites" });
  }
  res.status(201).json({ favorite: { productId } });
});

// DELETE /api/favorites/all — clear all favorites for the authenticated user
// Must be declared before /:productId so Express does not treat "all" as a productId
router.delete("/all", requireAuth, (req, res) => {
  const db = getDb();
  const result = db.prepare("DELETE FROM user_favorites WHERE user_id = ?").run(req.user.id);
  res.json({ deleted: result.changes });
});

// DELETE /api/favorites/:productId — remove a single favorite
router.delete("/:productId", requireAuth, validate(REMOVE_SCHEMA), (req, res) => {
  const db = getDb();
  const productId = validator.escape(String(req.params.productId));
  const result = db
    .prepare("DELETE FROM user_favorites WHERE user_id = ? AND product_id = ?")
    .run(req.user.id, productId);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Favorite not found" });
  }
  res.json({ deleted: true });
});

module.exports = router;
