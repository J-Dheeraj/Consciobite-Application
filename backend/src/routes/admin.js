const express = require("express");
const crypto = require("crypto");
const { requireAdmin } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { invalidateCache } = require("../middleware/cache");
const { getDb } = require("../db/schema");
const { getConflictLog, getConflictStats, snapshotScores } = require("../services/scoreAudit");
const {
  logMethodologyChange,
  getMethodologyChangelog,
  VALID_CATEGORIES,
} = require("../services/methodologyChangelog");
const { calculateGreenGrade } = require("../services/greengrade");
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

router.post("/rescore", (_req, res) => {
  const changes = snapshotScores(products, (product) =>
    calculateGreenGrade(product.emissions, product.category, product)
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

// --- Methodology changelog ---

const CHANGELOG_SCHEMA = {
  body: {
    version: { required: true, type: "string", pattern: /^\d+\.\d+$/ },
    category: {
      required: true,
      type: "string",
      pattern: new RegExp(`^(${VALID_CATEGORIES.join("|")})$`),
    },
    summary: { required: true, type: "string", minLength: 1, maxLength: 500 },
    commitRef: { required: false, type: "string", maxLength: 40 },
  },
};

router.post("/methodology-changelog", validate(CHANGELOG_SCHEMA), (req, res) => {
  const { version, category, summary, commitRef } = req.body;
  const entry = logMethodologyChange({ version, category, summary, commitRef });
  invalidateCache("methodology/changelog");
  res.status(201).json(entry);
});

router.get("/methodology-changelog", (_req, res) => {
  res.json({ entries: getMethodologyChangelog() });
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

module.exports = router;
