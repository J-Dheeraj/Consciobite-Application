-- Methodology changelog: tracks GreenGrade algorithm version history

CREATE TABLE IF NOT EXISTS methodology_changelog (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  description TEXT NOT NULL,
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  changed_by TEXT NOT NULL DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS idx_changelog_version ON methodology_changelog(version);
CREATE INDEX IF NOT EXISTS idx_changelog_date ON methodology_changelog(changed_at);

-- Seed known version history
INSERT OR IGNORE INTO methodology_changelog (id, version, description, changed_at, changed_by)
VALUES
  ('seed-v1', 'v1.0', 'Initial GreenGrade algorithm: linear weighted sum across 7 emission categories (Land Use Change, Animal Feed, Farm, Processing, Transport, Packaging, Retail). Scores mapped to 0–10 scale via min/max normalization.', '2023-01-15', 'system'),
  ('seed-v2', 'v2.0', 'Replaced min/max normalization with Gaussian Kernel Density Estimation (KDE). Added variance-based feature importance weighting so high-variance emission dimensions contribute more to the final score. Improved score stability across category boundaries.', '2023-07-01', 'system'),
  ('seed-v3', 'v3.0', 'Added Mahalanobis distance anomaly detection to flag outlier emission profiles. Introduced sigmoid transformation for final score mapping to reduce cliff effects at score boundaries. Added three-tier data confidence system (primary LCA, aggregated database, estimated/derived). Current version.', '2024-03-01', 'system');
