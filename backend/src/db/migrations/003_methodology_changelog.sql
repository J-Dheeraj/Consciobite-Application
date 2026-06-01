-- Track algorithm methodology version history for governance audit trail

CREATE TABLE IF NOT EXISTS methodology_changelog (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  summary TEXT NOT NULL,
  changes TEXT NOT NULL DEFAULT '[]',
  changed_by TEXT NOT NULL DEFAULT 'Consciobite Engineering',
  effective_date TEXT NOT NULL,
  changed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed the initial v3.0 entry representing the current released algorithm
INSERT OR IGNORE INTO methodology_changelog
  (id, version, summary, changes, changed_by, effective_date)
VALUES (
  'v3-initial',
  'v3.0',
  'Initial GreenGrade release with KDE scoring across 7 lifecycle emission dimensions',
  '["Gaussian Kernel Density Estimation with variance-based feature importance","7 emission categories: Land Use Change, Animal Feed, Farm, Processing, Transport, Packaging, Retail","Sigmoid transform normalises raw KDE density to 0–10 scale","3-tier data confidence system (Tier 1: industry datasets, Tier 2: regional proxies, Tier 3: estimated)","Open Food Facts integration for externally-scanned products not in the catalog"]',
  'Consciobite Engineering',
  '2025-01-01'
);
