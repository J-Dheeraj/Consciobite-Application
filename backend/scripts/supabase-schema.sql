-- Consciobite — Supabase schema (Session 1)
-- Run once in the Supabase SQL editor.
-- Mirrors the SQLite schema exactly, adds RLS.

-- ── Products ────────────────────────────────────────────────────────────────
-- Read-only from client. Seeded from products.json via seed-products.js.

CREATE TABLE IF NOT EXISTS products (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  brand        TEXT,
  category     TEXT NOT NULL,
  barcode      TEXT,
  description  TEXT,
  emissions    JSONB NOT NULL,
  data_sources JSONB,
  purchase_links JSONB,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON products FOR SELECT USING (true);

-- ── Users ───────────────────────────────────────────────────────────────────
-- Managed by Supabase Auth (Session 3). Until then, stores password_hash for
-- current JWT auth. failed_attempts / locked_until removed in Session 3.

CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  email           TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  password_hash   TEXT NOT NULL,
  failed_attempts INT DEFAULT 0,
  locked_until    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- No client-side access to users table — all auth via backend JWT middleware.

-- ── Reviews ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reviews (
  id         TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  rating     INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user    ON reviews(user_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_public_read"  ON reviews FOR SELECT USING (true);
-- INSERT / DELETE enforced by backend middleware (not RLS yet — RLS tightened in Session 3)

-- ── Carbon logs ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS carbon_logs (
  id           TEXT PRIMARY KEY,
  user_id      TEXT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id   TEXT  NOT NULL,
  product_name TEXT  NOT NULL,
  quantity     REAL  NOT NULL DEFAULT 1,
  emissions    REAL  NOT NULL,
  logged_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carbon_user ON carbon_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_carbon_date ON carbon_logs(logged_at);

ALTER TABLE carbon_logs ENABLE ROW LEVEL SECURITY;
-- No client-side access — all reads/writes via authenticated backend routes.
-- In Session 3, add: CREATE POLICY "carbon_own" ON carbon_logs USING (user_id = auth.uid()::text);
