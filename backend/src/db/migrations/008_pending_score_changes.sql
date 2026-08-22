-- Staged score changes awaiting admin review before going live.
-- Supports the controlled score publication workflow (architecture reviewer steer).
CREATE TABLE IF NOT EXISTS pending_score_changes (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  old_score REAL,
  new_score REAL NOT NULL,
  score_delta REAL NOT NULL,
  staged_by TEXT NOT NULL,
  stage_reason TEXT NOT NULL,
  methodology_version TEXT,
  catalog_hash TEXT,
  code_revision TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'published', 'rejected')),
  reviewed_by TEXT,
  review_notes TEXT,
  staged_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_pending_score_changes_status ON pending_score_changes(status, staged_at DESC);
