const express = require("express");
const validator = require("validator");
const crypto = require("crypto");
const path = require("path");
const { getDb } = require("../db/schema");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const PRODUCTS_PATH = path.join(__dirname, "../data/products.json");

function buildProductLookup() {
  const products = require(PRODUCTS_PATH);
  const map = {};
  for (const p of products) {
    const total = Object.values(p.emissions).reduce((s, v) => s + v, 0);
    map[p.id] = { category: p.category, totalEmissions: Math.round(total * 100) / 100, name: p.name };
  }
  return { map, products };
}

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
    quantity: { required: false, type: "number", min: 0.1 },
  },
};

const DELETE_LOG_SCHEMA = {
  params: {
    id: { required: true, type: "string", maxLength: 40, message: "Invalid log ID" },
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

// GET /api/carbon/export - download all logs as CSV
router.get("/export", requireAuth, (req, res) => {
  const db = getDb();
  const logs = db
    .prepare(
      `
    SELECT logged_at, product_name, product_id, quantity, emissions,
           ROUND(emissions * quantity, 4) as total_emissions
    FROM carbon_logs
    WHERE user_id = ?
    ORDER BY logged_at DESC
  `
    )
    .all(req.user.id);

  const header =
    "Date,Product Name,Product ID,Quantity,Emissions per Unit (kg CO2e),Total Emissions (kg CO2e)";
  const rows = logs.map((log) =>
    [
      log.logged_at,
      `"${String(log.product_name).replace(/"/g, '""')}"`,
      log.product_id,
      log.quantity,
      log.emissions,
      log.total_emissions,
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="carbon-log.csv"');
  res.send(csv);
});

// GET /api/carbon/insights - emissions by category + greener swap suggestions
router.get("/insights", requireAuth, (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const { map: productMap, products } = buildProductLookup();

  const logs = db
    .prepare(
      `SELECT product_id, product_name,
              ROUND(SUM(emissions * quantity), 2) as totalEmissions,
              COUNT(*) as logs
       FROM carbon_logs WHERE user_id = ?
       GROUP BY product_id ORDER BY totalEmissions DESC`
    )
    .all(userId);

  // Group by category
  const categoryTotals = {};
  for (const log of logs) {
    const cat = productMap[log.product_id]?.category || "Other";
    if (!categoryTotals[cat]) categoryTotals[cat] = { category: cat, emissions: 0, logs: 0 };
    categoryTotals[cat].emissions = Math.round((categoryTotals[cat].emissions + log.totalEmissions) * 100) / 100;
    categoryTotals[cat].logs += log.logs;
  }
  const byCategory = Object.values(categoryTotals).sort((a, b) => b.emissions - a.emissions);

  // Greener swaps: for each of the top 3 products find the cheapest same-category alternative
  const swaps = [];
  for (const log of logs.slice(0, 3)) {
    const current = productMap[log.product_id];
    if (!current) continue;
    const alt = products
      .filter((p) => p.id !== log.product_id && p.category === current.category)
      .map((p) => ({ id: p.id, name: p.name, totalEmissions: Object.values(p.emissions).reduce((s, v) => s + v, 0) }))
      .filter((p) => p.totalEmissions < current.totalEmissions)
      .sort((a, b) => a.totalEmissions - b.totalEmissions)[0];

    if (alt) {
      swaps.push({
        from: { id: log.product_id, name: log.product_name, emissions: current.totalEmissions },
        to: { id: alt.id, name: alt.name, emissions: Math.round(alt.totalEmissions * 100) / 100 },
        savingPerUnit: Math.round((current.totalEmissions - alt.totalEmissions) * 100) / 100,
      });
    }
  }

  res.json({ byCategory, swaps });
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
