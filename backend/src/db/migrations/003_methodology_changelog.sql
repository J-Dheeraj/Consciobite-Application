-- Methodology changelog: tracks when the GreenGrade algorithm itself changes
-- Separate from score_change_logs which tracks individual product score changes.
-- Each row records a methodology version bump with human-readable notes.

CREATE TABLE IF NOT EXISTS methodology_changelog (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  changed_at TEXT DEFAULT (datetime('now')),
  changed_by TEXT NOT NULL DEFAULT 'system',
  summary TEXT NOT NULL,
  details TEXT
);

CREATE INDEX IF NOT EXISTS idx_methlog_version ON methodology_changelog(version);
CREATE INDEX IF NOT EXISTS idx_methlog_date ON methodology_changelog(changed_at);
