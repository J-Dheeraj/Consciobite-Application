const express = require("express");
const crypto = require("crypto");
const { requireAdmin } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { getDb } = require("../db/schema");
const { getConflictLog, getConflictStats, snapshotScores } = require("../services/scoreAudit");
const { calculateGreenGrade } = require("../services/greengrade");
const { getPendingEvidence, reviewEvidence } = require("../services/evidenceService");
const products = require("../data/products.json");

const router = express.Router();

router.use(requireAdmin);

// --- Conflict log ---

const LOG_SCHEMA = {
  query: {
    filter: { required: false, type: "string", pattern: /^(all|paying|non-paying)$/ },
    limit: { required: false, type: "string", pattern: /^\d+$/ },
    offset: { required: false, type: "string", pattern: /^\d+$/ },
  },
};

router.get("/conflict-log", validate(LOG_SCHEMA), (req, res) => {
  const filter = req.query.filter === "all" ? undefined : req.query.filter;
  const limit = Math.min(parseInt(req.query.limit) || 200, 500);
  const offset = parseInt(req.query.offset) || 0;

  const logs = getConflictLog({ filter, limit, offset });
  const stats = getConflictStats();

  res.json({ logs, stats });
});

// --- Rescore all products and log changes ---

router.post("/rescore", (req, res) => {
  const changes = snapshotScores(
    products,
    (product) => calculateGreenGrade(product.emissions, product.category, product),
    {
      changedBy: `admin:${req.user.email || req.user.id}`,
      changeReason: "Manual rescore via admin API",
    }
  );

  res.json({
    message: `Rescore complete. ${changes.length} score change(s) logged.`,
    changes,
  });
});

// --- Manufacturer CRUD ---

const CREATE_MFR_SCHEMA = {
  body: {
    name: { required: true, type: "string", minLength: 1, maxLength: 200 },
    email: { required: true, type: "string", minLength: 5, maxLength: 200 },
    isPaying: { required: false, type: "boolean" },
  },
};

router.post("/manufacturers", validate(CREATE_MFR_SCHEMA), (req, res) => {
  const db = getDb();
  const { name, email, isPaying } = req.body;
  const id = crypto.randomUUID();

  try {
    db.prepare(
      `INSERT INTO manufacturers (id, name, email, is_paying)
       VALUES (?, ?, ?, ?)`
    ).run(id, name, email, isPaying ? 1 : 0);
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(409).json({ error: "Manufacturer with this email already exists" });
    }
    throw err;
  }

  res.status(201).json({ id, name, email, isPaying: !!isPaying });
});

router.get("/manufacturers", (_req, res) => {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM manufacturers ORDER BY onboarded_at DESC").all();
  res.json(rows);
});

// --- Link product to manufacturer ---

const LINK_SCHEMA = {
  body: {
    productId: { required: true, type: "string", minLength: 1 },
    manufacturerId: { required: true, type: "string", minLength: 1 },
  },
};

router.post("/product-manufacturer", validate(LINK_SCHEMA), (req, res) => {
  const db = getDb();
  const { productId, manufacturerId } = req.body;

  const mfr = db.prepare("SELECT id FROM manufacturers WHERE id = ?").get(manufacturerId);
  if (!mfr) return res.status(404).json({ error: "Manufacturer not found" });

  const product = products.find((p) => String(p.id) === productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  db.prepare(
    `INSERT INTO product_manufacturers (product_id, manufacturer_id)
     VALUES (?, ?)
     ON CONFLICT(product_id) DO UPDATE SET manufacturer_id = excluded.manufacturer_id`
  ).run(productId, manufacturerId);

  res.json({ productId, manufacturerId });
});

// --- Manufacturer fee acknowledgement ---

const ACK_SCHEMA = {
  params: {
    id: { required: true, type: "string", minLength: 1 },
  },
};

router.post("/manufacturers/:id/acknowledge-fee", validate(ACK_SCHEMA), (req, res) => {
  const db = getDb();
  const result = db
    .prepare("UPDATE manufacturers SET listing_fee_ack = 1 WHERE id = ?")
    .run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Manufacturer not found" });
  }

  res.json({ acknowledged: true });
});

// --- Community Evidence Review ---

const EVIDENCE_REVIEW_SCHEMA = {
  body: {
    status: {
      required: true,
      type: "string",
      pattern: /^(approved|rejected)$/,
      message: "status must be 'approved' or 'rejected'",
    },
    notes: { required: false, type: "string", maxLength: 500 },
  },
};

router.get("/pending-evidence", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  const pending = getPendingEvidence({ limit, offset });
  res.json({ evidence: pending, total: pending.length });
});

router.post("/evidence/:id/review", validate(EVIDENCE_REVIEW_SCHEMA), (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id < 1) {
    return res.status(400).json({ error: "Invalid evidence ID" });
  }

  const { status, notes } = req.body;
  const updated = reviewEvidence(id, req.user.id, status, notes);

  if (!updated) {
    return res.status(404).json({ error: "Evidence not found or already reviewed" });
  }

  res.json({ id, status, message: `Evidence ${status}` });
});

module.exports = router;
