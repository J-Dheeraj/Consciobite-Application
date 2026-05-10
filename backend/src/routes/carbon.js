const express = require("express");
const validator = require("validator");
const crypto = require("crypto");
const { getDb } = require("../db/schema");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();

const POST_LOG_SCHEMA = {
  body: {
    productId: { required: true, type: "string", maxLength: 50, message: "productId is required" },
    productName: {
      required: true,
      type: "string",
      maxLength: 100,
      message: "productName is required",
    },
    emissions: {
      required: true,
      type: "number",
      min: 0,
      message: "emissions must be a non-negative number",
    },
    quantity: { required: false, type: "number", min: 0.1, max: 100 },
  },
};

const DELETE_LOG_SCHEMA = {
  params: {
    id: {
      required: true,
      type: "string",
      maxLength: 40,
      pattern: /^[0-9a-f-]{36}$/,
      message: "Invalid log ID",
    },
  },
};

const GET_LOGS_SCHEMA = {
  query: {
    page: {
      required: false,
      type: "string",
      pattern: /^\d+$/,
      message: "page must be a positive integer",
    },
    limit: {
      required: false,
      type: "string",
      pattern: /^\d+$/,
      message: "limit must be a positive integer",
    },
  },
};

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
router.get("/logs", requireAuth, validate(GET_LOGS_SCHEMA), (req, res) => {
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
router.post("/log", requireAuth, validate(POST_LOG_SCHEMA), (req, res) => {
  const { productId, productName, quantity, emissions } = req.body;

  const qty = Math.max(0.1, Math.min(100, quantity || 1));
  const emissionsVal = emissions;

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
router.delete("/log/:id", requireAuth, validate(DELETE_LOG_SCHEMA), (req, res) => {
  const logId = req.params.id;
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
