-- Methodology changelog: version-controlled log of GreenGrade algorithm changes

CREATE TABLE IF NOT EXISTS methodology_changelog (
  id TEXT PRIMARY KEY,
  logged_at TEXT NOT NULL DEFAULT (datetime('now')),
  change_type TEXT NOT NULL,
  version TEXT,
  summary TEXT NOT NULL,
  detail TEXT,
  logged_by TEXT NOT NULL DEFAULT 'admin'
);

CREATE INDEX IF NOT EXISTS idx_changelog_date ON methodology_changelog(logged_at);

-- Seed with the initial v3.0 entry so the changelog is never empty
INSERT OR IGNORE INTO methodology_changelog (id, logged_at, change_type, version, summary, detail, logged_by)
VALUES (
  'seed-v3-init',
  '2026-04-01T00:00:00Z',
  'model_version',
  'v3.0',
  'Initial GreenGrade v3 release: Gaussian KDE scoring with Mahalanobis anomaly detection',
  '{"description":"Replaced v2 percentile lookup with Gaussian KDE (Silverman bandwidth). Added variance-based feature importance weighting, category-aware blended scoring (60% category / 40% global), sigmoid transform, and Mahalanobis distance anomaly detection at chi-squared 95th percentile (7 degrees of freedom).","impact":"All 550 product scores recalculated from scratch. Average category distributions unchanged; tail products most affected."}',
  'system'
);
