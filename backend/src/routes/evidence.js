const express = require("express");
const validator = require("validator");
const { validate } = require("../middleware/validate");
const { requireAdmin } = require("../middleware/auth");
const { getDb } = require("../db/schema");
const { getProductProvenance } = require("../services/dataProvenance");
const products = require("../data/products.json");

const router = express.Router();

const SOURCE_KEY_RE = /^[\w-]+$/;

// GET /api/v1/evidence/sources[?reliability=high|medium|low]
router.get("/sources", (req, res) => {
  const { reliability } = req.query;
  const db = getDb();

  if (reliability) {
    if (!/^(high|medium|low)$/.test(reliability)) {
      return res.status(400).json({ error: "reliability must be high, medium, or low" });
    }
    return res.json(
      db
        .prepare("SELECT * FROM evidence_sources WHERE reliability = ? ORDER BY year DESC, key ASC")
        .all(reliability)
    );
  }

  res.json(db.prepare("SELECT * FROM evidence_sources ORDER BY year DESC, key ASC").all());
});

// GET /api/v1/evidence/sources/:key
router.get("/sources/:key", (req, res) => {
  const key = validator.trim(req.params.key).slice(0, 100);
  if (!SOURCE_KEY_RE.test(key)) {
    return res.status(400).json({ error: "Invalid source key" });
  }

  const db = getDb();
  const source = db.prepare("SELECT * FROM evidence_sources WHERE key = ?").get(key);
  if (!source) return res.status(404).json({ error: "Evidence source not found" });

  const { c: explicitLinkCount } = db
    .prepare("SELECT COUNT(*) AS c FROM product_evidence_links WHERE source_key = ?")
    .get(key);

  res.json({ ...source, explicitLinkCount });
});

// GET /api/v1/evidence/product/:id
router.get("/product/:id", (req, res) => {
  const id = validator.trim(req.params.id).slice(0, 20);
  if (!validator.isNumeric(id)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  const product = products.find((p) => String(p.id) === id);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const provenance = getProductProvenance(product, null);

  const db = getDb();
  const links = db
    .prepare(
      `SELECT pel.emission_category, pel.confidence_override, pel.linked_at, pel.notes,
              es.key, es.title, es.authors, es.year, es.doi, es.url, es.source_type, es.reliability
       FROM product_evidence_links pel
       JOIN evidence_sources es ON es.key = pel.source_key
       WHERE pel.product_id = ?
       ORDER BY pel.linked_at DESC`
    )
    .all(id);

  res.json({
    product_id: id,
    product_name: product.name,
    computed_provenance: provenance,
    explicit_links: links,
  });
});

// POST /api/v1/evidence/sources  (admin only — ingest a new evidence source)
const NEW_SOURCE_SCHEMA = {
  body: {
    key: { required: true, type: "string", minLength: 1, maxLength: 100 },
    title: { required: true, type: "string", minLength: 1, maxLength: 500 },
    year: { required: true, type: "number", min: 1900, max: 2100 },
    source_type: { required: true, type: "string", minLength: 1, maxLength: 50 },
    reliability: { required: true, type: "string", minLength: 1 },
  },
};

router.post("/sources", requireAdmin, validate(NEW_SOURCE_SCHEMA), (req, res) => {
  const {
    key,
    title,
    authors,
    year,
    doi,
    url,
    source_type,
    methodology,
    granularity,
    reliability,
    notes,
  } = req.body;

  if (!SOURCE_KEY_RE.test(key)) {
    return res
      .status(400)
      .json({ error: "key must contain only alphanumeric characters, underscores, or hyphens" });
  }
  if (!["high", "medium", "low"].includes(reliability)) {
    return res.status(400).json({ error: "reliability must be high, medium, or low" });
  }

  const db = getDb();
  try {
    db.prepare(
      `INSERT INTO evidence_sources
         (key, title, authors, year, doi, url, source_type, methodology, granularity, reliability, ingested_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      key,
      title,
      authors || null,
      year,
      doi || null,
      url || null,
      source_type,
      methodology || null,
      granularity || "category",
      reliability,
      `admin:${req.user.email || req.user.id}`,
      notes || null
    );
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(409).json({ error: "Evidence source with this key already exists" });
    }
    throw err;
  }

  res.status(201).json(db.prepare("SELECT * FROM evidence_sources WHERE key = ?").get(key));
});

// POST /api/v1/evidence/product-link  (admin only — link a product to a source)
const LINK_SCHEMA = {
  body: {
    product_id: { required: true, type: "string", minLength: 1 },
    source_key: { required: true, type: "string", minLength: 1 },
  },
};

router.post("/product-link", requireAdmin, validate(LINK_SCHEMA), (req, res) => {
  const { product_id, source_key, emission_category, confidence_override, notes } = req.body;

  const product = products.find((p) => String(p.id) === String(product_id));
  if (!product) return res.status(404).json({ error: "Product not found" });

  const db = getDb();
  const source = db.prepare("SELECT key FROM evidence_sources WHERE key = ?").get(source_key);
  if (!source) return res.status(404).json({ error: "Evidence source not found" });

  if (confidence_override && !["high", "medium", "low"].includes(confidence_override)) {
    return res.status(400).json({ error: "confidence_override must be high, medium, or low" });
  }

  try {
    db.prepare(
      `INSERT INTO product_evidence_links
         (product_id, source_key, emission_category, confidence_override, linked_by, notes)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      String(product_id),
      source_key,
      emission_category || null,
      confidence_override || null,
      `admin:${req.user.email || req.user.id}`,
      notes || null
    );
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(409).json({ error: "This product-source link already exists" });
    }
    throw err;
  }

  res.status(201).json({
    product_id: String(product_id),
    source_key,
    emission_category: emission_category || null,
    confidence_override: confidence_override || null,
    product_name: product.name,
  });
});

module.exports = router;
