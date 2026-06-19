-- Audit trail for changes to GreenGrade's hardcoded scoring parameters
-- (fallback maximums, anomaly threshold, blend weights), as distinct from
-- per-product score_change_logs.
CREATE TABLE IF NOT EXISTS model_parameter_logs (
  id TEXT PRIMARY KEY,
  parameters_json TEXT NOT NULL,
  parameters_hash TEXT NOT NULL,
  changed_at TEXT DEFAULT (datetime('now')),
  change_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_paramlog_date ON model_parameter_logs(changed_at);
