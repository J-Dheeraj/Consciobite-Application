-- Governance layer: manufacturer tracking, score change audit log, admin role

-- Track manufacturers and their paying status
CREATE TABLE IF NOT EXISTS manufacturers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  is_paying INTEGER NOT NULL DEFAULT 0,
  listing_fee_ack INTEGER NOT NULL DEFAULT 0,
  onboarded_at TEXT DEFAULT (datetime('now'))
);

-- Map products to manufacturers (products live in JSON, this links them)
CREATE TABLE IF NOT EXISTS product_manufacturers (
  product_id TEXT PRIMARY KEY,
  manufacturer_id TEXT NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prodmfr_manufacturer ON product_manufacturers(manufacturer_id);

-- Audit trail for every GreenGrade score change
CREATE TABLE IF NOT EXISTS score_change_logs (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  manufacturer_id TEXT,
  is_paying_client INTEGER NOT NULL DEFAULT 0,
  old_score REAL NOT NULL,
  new_score REAL NOT NULL,
  score_delta REAL NOT NULL,
  changed_at TEXT DEFAULT (datetime('now')),
  changed_by TEXT,
  change_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_scorelog_product ON score_change_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_scorelog_manufacturer ON score_change_logs(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_scorelog_paying ON score_change_logs(is_paying_client);
CREATE INDEX IF NOT EXISTS idx_scorelog_date ON score_change_logs(changed_at);

-- Snapshot of last-known scores so we can detect changes on rescore
CREATE TABLE IF NOT EXISTS product_scores (
  product_id TEXT PRIMARY KEY,
  score REAL NOT NULL,
  scored_at TEXT DEFAULT (datetime('now'))
);

-- Add admin role to users (default 'user' for existing rows)
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
