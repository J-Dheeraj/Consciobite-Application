-- Methodology changelog: version-controlled log of GreenGrade algorithm changes

CREATE TABLE IF NOT EXISTS methodology_changelog (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  released_at TEXT NOT NULL,
  summary TEXT NOT NULL,
  changes TEXT NOT NULL,  -- JSON array of change strings
  changed_by TEXT NOT NULL DEFAULT 'system'
);

-- Seed historical versions
INSERT OR IGNORE INTO methodology_changelog (id, version, released_at, summary, changes, changed_by) VALUES
  (
    'changelog-v1',
    '1.0',
    '2024-01-15',
    'Initial GreenGrade release — linear weighted sum across 7 emission dimensions.',
    '["Initial methodology launch","7 supply-chain emission categories: Land Use Change, Animal Feed, Farm, Processing, Transport, Packaging, Retail","Simple weighted average scoring (0-10 scale)","Reference dataset: Poore & Nemecek (2018) Science paper","Category-level normalisation based on product averages"]',
    'system'
  ),
  (
    'changelog-v2',
    '2.0',
    '2024-09-01',
    'Introduced Gaussian KDE and variance-based feature weighting to better differentiate products within categories.',
    '["Replaced linear weighted sum with Gaussian Kernel Density Estimation (KDE)","Variance-based feature importance: dimensions with higher spread carry more weight","Non-linear sigmoid transform for final score mapping","Anomaly detection via Mahalanobis distance","Confidence scoring: data tier + source agreement + recency","Open Food Facts integration for barcode-scanned products not in catalog","550 product catalog expanded from 200"]',
    'system'
  ),
  (
    'changelog-v3',
    '3.0',
    '2025-06-01',
    'Governance layer added — audit trail, conflict-of-interest firewall, and independent advisory panel framework.',
    '["Score change audit trail: every GreenGrade update logged with paying-client attribution","Manufacturer registry: products linked to paying vs. non-paying clients","Conflict-of-interest statistics published on transparency page","Independent Advisory Panel framework established (3 seats: academic, regulatory, industry)","Digital Product Passport API (v1) for third-party integrations","Methodology documentation fully published at /methodology","Data provenance per-product: tier, source agreement, confidence label"]',
    'system'
  );
