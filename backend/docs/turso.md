# Database on Turso

## Why

Render's free plan has no persistent disk. The SQLite file in `backend/data/`
is wiped on every deploy and every spin-down (15 idle minutes), so users,
reviews, favourites, carbon logs and the score audit chain all reset. Products
survive only because they are reloaded from `products.json`.

With `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` set, the API opens the file as
a Turso **embedded replica** (`src/db/driver.js`): reads hit the local copy,
every write goes to the hosted primary, and on startup the replica pulls the
primary's state before the server listens. Restarts no longer lose data.

With the variables unset, nothing changes: the API uses better-sqlite3 on the
local file, as before. Tests and local development need no account.

## One-time setup

1. Sign up at https://turso.tech (the free plan is enough).
2. Create a database named `consciobite`. Pick the location closest to the
   Render region of `consciobite-api` (shown on the service's page in Render).
   With the CLI:

   ```sh
   turso db create consciobite
   turso db show consciobite --url       # -> libsql://consciobite-<you>.turso.io
   turso db tokens create consciobite    # -> long token, copy it once
   ```

   In the web dashboard the URL is on the database page, and the token is under
   "Create Token" (read and write, no expiry, or set a reminder to rotate it).
3. In Render, open `consciobite-api` -> Environment, add:
   - `TURSO_DATABASE_URL` = the `libsql://...` URL
   - `TURSO_AUTH_TOKEN` = the token
4. Save. Render redeploys. In the logs you should see
   `Database: Turso embedded replica, synced from primary`. The schema and all
   migrations are created on the primary on that first start.
5. Check: register a test account, then in Render use "Restart service". The
   account should still log in afterwards.

## Things to know

- Every write is a round trip to Turso and the driver is synchronous, so a
  write blocks the event loop for that round trip (tens of ms when Turso and
  Render are in the same region). Fine at this app's traffic; revisit before
  any real load.
- Startup waits for the initial sync. If Turso is unreachable at that moment
  the boot fails: during a deploy Render keeps the previous instance, but a
  cold start after spin-down stays down until Turso answers.
- Never commit the token. If it leaks, revoke it with
  `turso db tokens invalidate consciobite` and set a new one in Render.
- `npm run backup` still snapshots the local file. On Turso, use its built-in
  point-in-time restore instead.
- `DB_DRIVER=libsql` runs the libsql code path against a local file with no
  network. CI runs the whole backend suite that way as well.
