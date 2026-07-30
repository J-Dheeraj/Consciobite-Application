-- Token revocation registry + score provenance binding
-- Additive only: new table + new nullable columns; existing data untouched.

CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti TEXT PRIMARY KEY,
  user_id TEXT,
  revoked_at TEXT DEFAULT (datetime('now')),
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires ON revoked_tokens(expires_at);

-- Bind each score change to the inputs that produced it
ALTER TABLE score_change_logs ADD COLUMN methodology_version TEXT;
ALTER TABLE score_change_logs ADD COLUMN catalog_hash TEXT;
ALTER TABLE score_change_logs ADD COLUMN code_revision TEXT;
