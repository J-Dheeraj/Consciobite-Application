-- Evidence source registry: persistent store for literature sources backing
-- GreenGrade emission factors. Additive only — no existing tables altered.

CREATE TABLE IF NOT EXISTS evidence_sources (
  key         TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  authors     TEXT,
  year        INTEGER NOT NULL,
  doi         TEXT,
  url         TEXT,
  source_type TEXT NOT NULL DEFAULT 'peer-reviewed',
  methodology TEXT,
  granularity TEXT NOT NULL DEFAULT 'category',
  reliability TEXT NOT NULL DEFAULT 'medium' CHECK(reliability IN ('high','medium','low')),
  ingested_by TEXT,
  ingested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes       TEXT
);

-- Seed the four canonical sources from the GreenGrade reference data
INSERT OR IGNORE INTO evidence_sources
  (key, title, authors, year, doi, url, source_type, methodology, granularity, reliability)
VALUES
  ('poore_nemecek_2018',
   'Reducing food''s environmental impacts through producers and consumers',
   'Poore, J. & Nemecek, T.',
   2018,
   '10.1126/science.aaq0216',
   'https://doi.org/10.1126/science.aaq0216',
   'peer_reviewed_lca',
   'Meta-analysis of 570 studies covering 38,700 farms and 1,600 processors across 119 countries.',
   'product_type',
   'high'),
  ('our_world_in_data',
   'Environmental Impacts of Food Production',
   'Ritchie, H. & Roser, M.',
   2020,
   null,
   'https://ourworldindata.org/food-ghg-emissions',
   'curated_aggregation',
   'Curated visualization of Poore & Nemecek data with additional context and per-country adjustments.',
   'product_type',
   'high'),
  ('openfoodfacts',
   'Open Food Facts - the free food products database',
   'Open Food Facts contributors',
   2024,
   null,
   'https://world.openfoodfacts.org',
   'crowdsourced_database',
   'Crowdsourced product data with Ecoscore grade (A-E) computed from Agribalyse LCA data, transport adjustments, and packaging impact.',
   'brand_product',
   'medium'),
  ('category_estimate',
   'Category Average Estimate',
   'Consciobite internal',
   2024,
   null,
   null,
   'derived_estimate',
   'Emissions estimated by applying category-average baselines derived from Poore & Nemecek (2018) with adjustments for product subcategory.',
   'category',
   'low');

-- Explicit product-to-source links for fine-grained provenance tracking
CREATE TABLE IF NOT EXISTS product_evidence_links (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id          TEXT NOT NULL,
  source_key          TEXT NOT NULL REFERENCES evidence_sources(key),
  emission_category   TEXT,
  confidence_override TEXT CHECK(confidence_override IN ('high','medium','low') OR confidence_override IS NULL),
  linked_by           TEXT NOT NULL,
  linked_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes               TEXT,
  UNIQUE(product_id, source_key, emission_category)
);

CREATE INDEX IF NOT EXISTS idx_pel_product_id ON product_evidence_links(product_id);
