const express = require("express");
const validator = require("validator");
const crypto = require("crypto");
const { getDb } = require("../db/schema");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/carbon/summary - get user's carbon footprint summary
router.get("/summary", requireAuth, (req, res) => {
  const db = getDb();
  const userId = req.user.id;

  const total = db
    .prepare(
      `
    SELECT COALESCE(SUM(emissions * quantity), 0) as totalEmissions,
           COUNT(*) as totalLogs,
           COALESCE(SUM(quantity), 0) as totalItems
    FROM carbon_logs WHERE user_id = ?
  `
    )
    .get(userId);

  const weekly = db
    .prepare(
      `
    SELECT COALESCE(SUM(emissions * quantity), 0) as emissions,
           COUNT(*) as logs
    FROM carbon_logs
    WHERE user_id = ? AND logged_at >= datetime('now', '-7 days')
  `
    )
    .get(userId);

  const monthly = db
    .prepare(
      `
    SELECT COALESCE(SUM(emissions * quantity), 0) as emissions,
           COUNT(*) as logs
    FROM carbon_logs
    WHERE user_id = ? AND logged_at >= datetime('now', '-30 days')
  `
    )
    .get(userId);

  const byWeek = db
    .prepare(
      `
    SELECT strftime('%Y-W%W', logged_at) as week,
           ROUND(SUM(emissions * quantity), 2) as emissions,
           COUNT(*) as logs
    FROM carbon_logs
    WHERE user_id = ? AND logged_at >= datetime('now', '-90 days')
    GROUP BY week ORDER BY week
  `
    )
    .all(userId);

  const topProducts = db
    .prepare(
      `
    SELECT product_name, product_id,
           ROUND(SUM(emissions * quantity), 2) as totalEmissions,
           SUM(quantity) as totalQuantity
    FROM carbon_logs WHERE user_id = ?
    GROUP BY product_id ORDER BY totalEmissions DESC LIMIT 5
  `
    )
    .all(userId);

  res.json({
    total: {
      emissions: Math.round(total.totalEmissions * 100) / 100,
      logs: total.totalLogs,
      items: total.totalItems,
    },
    weekly: {
      emissions: Math.round(weekly.emissions * 100) / 100,
      logs: weekly.logs,
    },
    monthly: {
      emissions: Math.round(monthly.emissions * 100) / 100,
      logs: monthly.logs,
    },
    trend: byWeek,
    topProducts,
  });
});

// GET /api/carbon/logs - get user's carbon logs
router.get("/logs", requireAuth, (req, res) => {
  const db = getDb();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const total = db
    .prepare("SELECT COUNT(*) as count FROM carbon_logs WHERE user_id = ?")
    .get(req.user.id);

  const logs = db
    .prepare(
      `
    SELECT * FROM carbon_logs
    WHERE user_id = ?
    ORDER BY logged_at DESC
    LIMIT ? OFFSET ?
  `
    )
    .all(req.user.id, limit, offset);

  res.json({
    logs,
    pagination: {
      page,
      limit,
      totalCount: total.count,
      totalPages: Math.ceil(total.count / limit),
    },
  });
});

// POST /api/carbon/log - log a product purchase
router.post("/log", requireAuth, (req, res) => {
  const { productId, productName, quantity, emissions } = req.body;

  if (!productId || !productName || !emissions) {
    return res.status(400).json({ error: "productId, productName, and emissions are required" });
  }

  const qty = Math.max(0.1, Math.min(100, parseFloat(quantity) || 1));
  const emissionsVal = Math.max(0, parseFloat(emissions) || 0);

  const id = crypto.randomUUID();
  const db = getDb();

  db.prepare(
    "INSERT INTO carbon_logs (id, user_id, product_id, product_name, quantity, emissions) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(
    id,
    req.user.id,
    validator.escape(productId),
    validator.escape(productName.slice(0, 100)),
    qty,
    emissionsVal
  );

  const log = db.prepare("SELECT * FROM carbon_logs WHERE id = ?").get(id);
  res.status(201).json({ log });
});

// DELETE /api/carbon/log/:id - delete a carbon log
router.delete("/log/:id", requireAuth, (req, res) => {
  const logId = validator.escape(validator.trim(req.params.id)).slice(0, 40);
  const db = getDb();

  const log = db
    .prepare("SELECT * FROM carbon_logs WHERE id = ? AND user_id = ?")
    .get(logId, req.user.id);
  if (!log) {
    return res.status(404).json({ error: "Log not found" });
  }

  db.prepare("DELETE FROM carbon_logs WHERE id = ?").run(logId);
  res.json({ message: "Log deleted" });
});

module.exports = router;
