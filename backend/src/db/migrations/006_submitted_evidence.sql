-- Allow users to submit LCA evidence citations for product scores.
-- Approved submissions are surfaced on product detail pages.
-- Additive only: new table and indexes; no existing tables modified.

CREATE TABLE IF NOT EXISTS submitted_evidence (
  id             INTEGER  PRIMARY KEY AUTOINCREMENT,
  product_id     TEXT     NOT NULL,
  -- users.id is TEXT (UUID), so these FK columns must be TEXT to match
  submitted_by   TEXT     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submitter_email TEXT    NOT NULL,
  citation       TEXT     NOT NULL,
  source_type    TEXT     NOT NULL DEFAULT 'other'
    CHECK (source_type IN ('peer_reviewed_lca', 'lca_database', 'manufacturer_study', 'industry_report', 'other')),
  methodology    TEXT,
  url            TEXT,
  year           INTEGER,
  status         TEXT     NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  -- SET NULL (not the default NO ACTION) so deleting a reviewer's account
  -- cannot fail; the review decision itself is preserved.
  reviewer_id    TEXT     REFERENCES users(id) ON DELETE SET NULL,
  reviewer_notes TEXT,
  submitted_at   TEXT     DEFAULT (datetime('now')),
  reviewed_at    TEXT
);

CREATE INDEX IF NOT EXISTS idx_evidence_product ON submitted_evidence(product_id);
CREATE INDEX IF NOT EXISTS idx_evidence_status  ON submitted_evidence(status);
