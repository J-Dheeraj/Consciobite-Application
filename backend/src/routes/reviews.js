const express = require("express");
const validator = require("validator");
const crypto = require("crypto");
const { getDb } = require("../db/schema");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { invalidateCache } = require("../middleware/cache");

const router = express.Router();

// GET /api/reviews/:productId - get reviews for a product
router.get("/:productId", optionalAuth, (req, res) => {
  const productId = validator.escape(validator.trim(req.params.productId)).slice(0, 20);
  const db = getDb();

  const reviews = db.prepare(`
    SELECT r.id, r.product_id, r.rating, r.comment, r.created_at,
           u.name as user_name, u.id as user_id
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
  `).all(productId);

  const stats = db.prepare(`
    SELECT COUNT(*) as count, ROUND(AVG(rating), 1) as average
    FROM reviews WHERE product_id = ?
  `).get(productId);

  res.json({
    reviews,
    stats: { count: stats.count, average: stats.average || 0 },
  });
});

// POST /api/reviews/:productId - add a review
router.post("/:productId", requireAuth, (req, res) => {
  const productId = validator.escape(validator.trim(req.params.productId)).slice(0, 20);
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  const sanitizedComment = comment
    ? validator.escape(validator.trim(comment)).slice(0, 500)
    : null;

  const db = getDb();

  const existing = db.prepare(
    "SELECT id FROM reviews WHERE product_id = ? AND user_id = ?"
  ).get(productId, req.user.id);

  if (existing) {
    return res.status(409).json({ error: "You have already reviewed this product" });
  }

  const id = crypto.randomUUID();
  db.prepare(
    "INSERT INTO reviews (id, product_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?)"
  ).run(id, productId, req.user.id, rating, sanitizedComment);

  invalidateCache(`reviews/${productId}`);

  const review = db.prepare(`
    SELECT r.id, r.product_id, r.rating, r.comment, r.created_at,
           u.name as user_name, u.id as user_id
    FROM reviews r JOIN users u ON r.user_id = u.id
    WHERE r.id = ?
  `).get(id);

  res.status(201).json({ review });
});

// DELETE /api/reviews/:reviewId - delete own review
router.delete("/:reviewId", requireAuth, (req, res) => {
  const reviewId = validator.escape(validator.trim(req.params.reviewId)).slice(0, 40);
  const db = getDb();

  const review = db.prepare("SELECT * FROM reviews WHERE id = ?").get(reviewId);
  if (!review) {
    return res.status(404).json({ error: "Review not found" });
  }

  if (review.user_id !== req.user.id) {
    return res.status(403).json({ error: "You can only delete your own reviews" });
  }

  db.prepare("DELETE FROM reviews WHERE id = ?").run(reviewId);
  invalidateCache(`reviews/${review.product_id}`);

  res.json({ message: "Review deleted" });
});

module.exports = router;
