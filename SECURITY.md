# Security Policy — Consciobite

## Reporting a vulnerability

Email rajdheeraj26@gmail.com with a description and reproduction steps.
Please do not open public issues for security reports.

## Dependency vulnerability triage policy

CI gates (`.github/workflows/ci.yml`):

- **Backend:** `npm audit --production --audit-level=high` — any high or
  critical finding in production dependencies fails the build.
- **Frontend:** `npm run audit:ci` (`frontend/scripts/audit-gate.js`) — any
  **critical** finding fails the build *unless* its advisory ID is named in
  that script's `ALLOWED` map with a reason. A newly published critical is not
  on the list, so it fails. While the list has entries it also carries a
  `REVIEW_BY` date and fails once that passes, so the list cannot quietly
  become permanent.

This replaced a bare `npm audit --audit-level=critical`, which had degenerated
into a choice between failing forever on advisories that cannot affect this
build and switching the gate off. Named, dated exceptions keep it meaningful.

### Why the frontend differs

The deployed frontend is a **static export** (`output: "export"` — plain
HTML/JS/CSS served by nginx/Render). The Next.js server, image optimizer,
middleware, Server Actions and React Server Components never execute in
production, so advisories in that code cannot be reached.

### Current exceptions: none

`ALLOWED` in `audit-gate.js` is empty. The Next 16 upgrade (2026-11-28)
cleared the three `next` RCE advisories accepted on 2026-10-30
(`GHSA-p293-qw3h-jr36`, `GHSA-2xp9-vwfh-vxw4`, `GHSA-2464-fhr4-w9xw`), and
`npm audit` on the frontend lockfile then reported 0 critical and 0 high
findings (18 moderate, in `glob` and `minimatch`). With no exceptions there is
no `REVIEW_BY` date; the gate enforces one again as soon as an entry is added.

Any future exception is void if the deployment model changes. If the frontend
stops being a static export (adding a Next server, middleware, Server Actions,
ISR or the image optimizer), re-triage every entry.

### Triage rules

1. Any **critical**: fix, remove, or add a dated exception here *and* in
   `audit-gate.js` with a verified reason. Never silence it in CI alone.
2. Any **high** in code that executes in production with untrusted input:
   treat as critical.
3. High findings in build-time-only or non-executing paths: record above.
4. Re-run triage whenever the deployment model changes.

## Authentication model (current)

- Short-lived JWT (2h, HS256, `jti`) issued on login; httpOnly `SameSite=Strict`
  cookie plus an in-memory copy for the SPA — never persisted to browser storage.
- `POST /api/auth/refresh` rotates the cookie and returns a fresh token.
- `POST /api/auth/logout` revokes the presented token's `jti` server-side
  (`revoked_tokens` table) **and** stamps `users.tokens_valid_from`, so every
  token issued before that moment is rejected too — logging out ends the
  session on all tabs and devices, not just the one that called it. All auth
  middleware applies both checks.
- Account lockout after 5 failed logins per email+IP (15 min window).
- Known limitation: lockout and rate-limit state are process-local; they
  reset on restart and do not synchronize across instances.

## Operational backups

In production the database is a hosted Turso database (see
`backend/docs/turso.md`). Use Turso's point-in-time restore for recovery;
`npm run backup` there would only snapshot the API's local replica.

`cd backend && npm run backup` snapshots a local SQLite database (using the
online backup API — safe while the server runs), for local or self-hosted
setups without Turso. Each snapshot is verified before being reported as good:
SQLite's `integrity_check` must pass and every table's row count must match the
source, or the file is discarded and the command exits non-zero. Snapshots are
written as a single self-contained database rather than in WAL mode, so copying
the one file loses nothing.

- `BACKUP_DIR` — destination (default `backend/backups`). **The default sits on
  the same disk as the database, so it protects against operator error only,
  not host loss.** Point it at a persistent disk or mounted volume, or copy
  snapshots off-host.
- `BACKUP_KEEP` — snapshots to retain (default 7; `0` keeps all).

Nothing schedules this; it is a manual command.

## Audit-trail integrity

`score_change_logs` is append-only (SQL triggers reject `UPDATE` and `DELETE`)
and every record is HMAC-chained to its predecessor. The key comes from
`AUDIT_HMAC_KEY`, falling back to `JWT_SECRET`, and is never stored in the
database — so an attacker who reaches only the SQLite file cannot recompute a
valid chain.

`GET /api/admin/audit-integrity` (admin only) re-walks the chain and returns the
head hash. **Record that head off-host.** Edits, deletions and splices break the
chain on their own, but deleting the newest records leaves a shorter,
self-consistent chain that only a known-good head reveals. An attacker holding
the key can also forge the chain, so this is tamper-*evident* against a
database-level adversary, not tamper-proof against host compromise.
