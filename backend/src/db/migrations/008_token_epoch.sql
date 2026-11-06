-- Per-user token epoch (unix seconds). Logout stamps it with the current time;
-- auth then rejects any token issued before it, so logging out invalidates
-- every outstanding token for the account rather than only the one presented.
--
-- Default 0 so existing users' current tokens stay valid through the upgrade.
ALTER TABLE users ADD COLUMN tokens_valid_from INTEGER NOT NULL DEFAULT 0;
