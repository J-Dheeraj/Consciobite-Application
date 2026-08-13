-- Controlled score publication: detected score changes wait for admin approval
-- before the Digital Product Passport reflects them.

CREATE TABLE IF NOT EXISTS pending_score_publications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  old_grade REAL,
  new_grade REAL NOT NULL,
  new_breakdown TEXT NOT NULL,
  detected_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TEXT,
  review_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_pending_pub_status
  ON pending_score_publications (status, detected_at DESC);

-- Admin-approved scores; the DPP passport API returns these instead of
-- live-computed values so B2B clients see only vetted scores.
CREATE TABLE IF NOT EXISTS published_scores (
  product_id TEXT PRIMARY KEY,
  grade REAL NOT NULL,
  grade_label TEXT NOT NULL,
  breakdown TEXT NOT NULL,
  published_by TEXT NOT NULL,
  published_at TEXT NOT NULL DEFAULT (datetime('now')),
  methodology_version TEXT NOT NULL,
  catalog_hash TEXT NOT NULL
);
