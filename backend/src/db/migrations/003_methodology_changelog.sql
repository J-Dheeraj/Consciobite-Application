-- Versioned audit trail for GreenGrade algorithm/methodology changes
-- (distinct from score_change_logs, which audits per-product score deltas)

CREATE TABLE IF NOT EXISTS methodology_versions (
  id TEXT PRIMARY KEY,
  version TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  changed_params TEXT,
  released_at TEXT DEFAULT (datetime('now')),
  released_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_methodver_released ON methodology_versions(released_at);

-- Backfill the current baseline so methodology_version is no longer a bare
-- hardcoded string in passport.js / dataProvenance.js
INSERT INTO methodology_versions (id, version, summary, changed_params, released_by)
VALUES (
  'seed-v3-0',
  '3.0',
  'Baseline GreenGrade v3: KDE scoring with variance-weighted feature importance, 60% category / 40% global CDF blend, sigmoid normalization, Mahalanobis anomaly detection.',
  '{"blend":"0.6 category + 0.4 global","sigmoid":{"k":5,"midpoint":0.5},"anomalyThreshold":14.067}',
  'system'
);
