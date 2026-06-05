-- Methodology version history: tracks GreenGrade algorithm parameter changes

CREATE TABLE IF NOT EXISTS methodology_versions (
  version TEXT PRIMARY KEY,
  released_at TEXT NOT NULL,
  summary TEXT NOT NULL,
  changes TEXT NOT NULL,
  breaking_change INTEGER NOT NULL DEFAULT 0
);

-- Seed historical versions (idempotent via INSERT OR IGNORE)
INSERT OR IGNORE INTO methodology_versions (version, released_at, summary, changes, breaking_change) VALUES
(
  '1.0',
  '2024-09-01',
  'Initial GreenGrade release — simple percentile ranking across 7 emission dimensions.',
  '[
    {"type":"added","description":"7 lifecycle emission dimensions: Land Use Change, Animal Feed, Farm, Processing, Transport, Packaging, Retail"},
    {"type":"added","description":"Product scoring via linear percentile ranking within each emission category"},
    {"type":"added","description":"Color thresholds: Green 7–10, Yellow 4–6.9, Red 0–3.9"},
    {"type":"added","description":"Fallback maximums for untrained calls (FALLBACK_MAX constants)"}
  ]',
  0
),
(
  '2.0',
  '2025-03-15',
  'ML rewrite: Gaussian KDE replaces linear percentile ranking; category-aware blended scoring introduced.',
  '[
    {"type":"changed","description":"Scoring method replaced: linear percentile ranking → Gaussian Kernel Density Estimation (KDE) with Silverman bandwidth"},
    {"type":"added","description":"Variance-based feature importance weighting — high-spread dimensions carry more discriminating power"},
    {"type":"added","description":"Category-aware blended scoring: 60% category-relative KDE CDF + 40% global KDE CDF"},
    {"type":"added","description":"Non-linear sigmoid transform to expand resolution where most products cluster"},
    {"type":"added","description":"Confidence signal based on category sample size"},
    {"type":"changed","description":"Model now trained on full product catalog at server startup (trainModel())"}
  ]',
  1
),
(
  '3.0',
  '2025-11-01',
  'Anomaly detection and data provenance tracking added; backward-compatible output extended.',
  '[
    {"type":"added","description":"Mahalanobis anomaly detection using full covariance matrix; flags outliers beyond chi-squared 95th-percentile threshold (χ²₇ = 14.067)"},
    {"type":"added","description":"Data provenance tracking: dataConfidence, dataTier, and emission source citations per product"},
    {"type":"added","description":"Extended output fields: percentile, categoryRank, anomaly, dataConfidence, dataTier, sources"},
    {"type":"added","description":"computeDataConfidence() and findReference() functions for LCA source attribution"},
    {"type":"fixed","description":"Sparse category edge case: KDE falls back to global stats when category has fewer than 3 samples"}
  ]',
  0
);
