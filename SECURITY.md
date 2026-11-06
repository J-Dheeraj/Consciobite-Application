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
  on the list, so it fails. The exceptions also carry a `REVIEW_BY` date and
  fail once it passes, so the list cannot quietly become permanent.

This replaced a bare `npm audit --audit-level=critical`, which had degenerated
into a choice between failing forever on advisories that cannot affect this
build and switching the gate off. Named, dated exceptions keep it meaningful.

### Why the frontend differs

The deployed frontend is a **static export** (`output: "export"` — plain
HTML/JS/CSS served by nginx/Render). The Next.js server, image optimizer,
middleware, Server Actions and React Server Components never execute in
production, so advisories in that code cannot be reached.

### Current exceptions (reviewed 2026-10-30, re-review by 2027-01-31)

All three are in `next`, and all three are the *only* criticals in the tree.

| Advisory | Finding | Why it cannot apply here |
|---|---|---|
| `GHSA-p293-qw3h-jr36` | Unauthenticated RCE on Windows-hosted servers | No Next server runs at all; the build output is static files on nginx/Render |
| `GHSA-2xp9-vwfh-vxw4` | Unauthenticated RCE in the Image Optimization API (AVIF) | That API does not exist in a static export, and `next/image` is never imported — verified by grep across `frontend/src` |
| `GHSA-2464-fhr4-w9xw` | Unauthenticated RCE in the Image Optimization API (SVG) | Same as above |

Verified when these were accepted: `next.config.js` sets `output: "export"`;
`next/image` has no import anywhere in `frontend/src`; the app uses neither CSP
nonces nor `beforeInteractive` scripts (the two `next` advisories that are not
server-runtime). Of the 24 distinct `next` advisories in the tree, 22 are
plainly server-runtime and the remaining 2 need those unused features.

**These exceptions are void if the deployment model changes.** If the frontend
ever stops being a static export — adding a Next server, middleware, Server
Actions, ISR or the image optimizer — every one of them becomes live and the
right response is to upgrade Next, not to extend the list.

### Non-blocking findings

High findings in `next`, `postcss`, `nanoid` and `source-map-js` do not fail
the frontend gate. `postcss`, `nanoid` and `source-map-js` run at build time
over our own sources, not over untrusted input at runtime. The `next` highs are
server-runtime, as above. They are still worth clearing by upgrading Next,
which is tracked as separate work.

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

`cd backend && npm run backup` snapshots the SQLite database (using the
online backup API — safe while the server runs). Each snapshot is verified
before being reported as good: SQLite's `integrity_check` must pass and every
table's row count must match the source, or the file is discarded and the
command exits non-zero. Snapshots are written as a single self-contained
database rather than in WAL mode, so copying the one file loses nothing.

- `BACKUP_DIR` — destination (default `backend/backups`). **The default sits on
  the same ephemeral disk as the database, so it protects against operator error
  only, not host loss.** Point it at a persistent disk or mounted volume, or copy
  snapshots off-host.
- `BACKUP_KEEP` — snapshots to retain (default 7; `0` keeps all).

Nothing schedules this yet; it is a manual command.

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
