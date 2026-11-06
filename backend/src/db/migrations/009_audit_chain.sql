-- Tamper-evidence for the score-change audit trail (T-6).
--
-- Each row carries an HMAC of its own content chained to the previous row's
-- hash, so editing, deleting or splicing a record breaks every hash after it.
-- The key lives in the environment, not the database, so an attacker who
-- reaches only the SQLite file cannot recompute a valid chain.
--
-- NULL on existing rows: they predate the chain and verification reports them
-- as unchained rather than as tampered.
ALTER TABLE score_change_logs ADD COLUMN prev_hash TEXT;
ALTER TABLE score_change_logs ADD COLUMN entry_hash TEXT;

-- Append-only at the storage layer. These stop the ordinary code paths and
-- casual sqlite3 edits; they do not stop someone who can DROP the triggers,
-- which is why the HMAC chain above exists as well.
CREATE TRIGGER IF NOT EXISTS score_change_logs_no_update
BEFORE UPDATE ON score_change_logs
BEGIN
  SELECT RAISE(ABORT, 'score_change_logs is append-only');
END;

CREATE TRIGGER IF NOT EXISTS score_change_logs_no_delete
BEFORE DELETE ON score_change_logs
BEGIN
  SELECT RAISE(ABORT, 'score_change_logs is append-only');
END;
