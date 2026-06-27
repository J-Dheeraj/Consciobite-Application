-- Methodology changelog: version history of GreenGrade algorithm/parameter changes.
-- Distinct from score_change_logs (per-product score drift) — this tracks changes
-- to the scoring methodology itself (weights, formula, data sources).

CREATE TABLE IF NOT EXISTS methodology_changelog (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  commit_ref TEXT,
  changed_by TEXT NOT NULL DEFAULT 'system',
  change_date TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_methodology_changelog_date ON methodology_changelog(change_date);

-- Seed real history (from git log of backend/src/services/greengrade.js)
INSERT INTO methodology_changelog (id, version, category, summary, commit_ref, changed_by, change_date)
VALUES
  (
    'seed-v1',
    '1.0',
    'algorithm',
    'Initial GreenGrade scoring: percentile-based ranking across 7 emission categories (Land Use Change, Animal Feed, Farm, Processing, Transport, Packaging, Retail).',
    '751fd77',
    'system',
    '2026-01-30 00:00:00'
  ),
  (
    'seed-v2',
    '2.0',
    'algorithm',
    'Upgraded to data-driven ML scoring: variance-based feature weighting, category-aware blended scoring, and a non-linear sigmoid transform.',
    'e0e9f32',
    'system',
    '2026-02-27 00:00:00'
  ),
  (
    'seed-v3',
    '3.0',
    'algorithm',
    'Added Gaussian Kernel Density Estimation for smoother probability density scoring and Mahalanobis distance anomaly detection against category centroids.',
    '57e046e',
    'system',
    '2026-03-04 00:00:00'
  );
