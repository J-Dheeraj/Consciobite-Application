-- Persisted product catalog. Seeded from products.json at first startup via
-- productService.seedFromJson(); admin API allows creating, updating, and
-- soft-deleting entries at runtime without a redeployment.
--
-- product_data stores the complete product JSON (emissions, purchaseLinks,
-- dataSources, etc.) so the schema is forward-compatible with new fields.
-- name/brand/category/barcode are denormalised for future SQL-level queries.

CREATE TABLE IF NOT EXISTS catalog_products (
  id           TEXT    PRIMARY KEY,
  name         TEXT    NOT NULL,
  brand        TEXT    NOT NULL,
  category     TEXT    NOT NULL,
  barcode      TEXT,
  is_active    INTEGER NOT NULL DEFAULT 1,
  source       TEXT    NOT NULL DEFAULT 'catalog',
  product_data TEXT    NOT NULL,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_catalog_category ON catalog_products(category, is_active);
CREATE INDEX IF NOT EXISTS idx_catalog_barcode  ON catalog_products(barcode) WHERE barcode IS NOT NULL;
