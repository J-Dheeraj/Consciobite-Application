# Security Policy — Consciobite

## Reporting a vulnerability

Email rajdheeraj26@gmail.com with a description and reproduction steps.
Please do not open public issues for security reports.

## Dependency vulnerability triage policy

CI gates (`.github/workflows/ci.yml`):

- **Backend:** `npm audit --production --audit-level=high` — any high or
  critical finding in production dependencies fails the build.
- **Frontend:** `npm audit --production --audit-level=critical` — critical
  findings fail the build. High findings do not fail automatically and MUST
  be triaged by exploitability below.

### Why the frontend gate differs

The deployed frontend is a **static export** (`output: 'export'` — plain
HTML/JS/CSS served by a static host). The Next.js server, image optimizer,
middleware, and server components never execute in production. Server-side
CVEs in the `next` package therefore do not affect the shipped artifact.

### Current triaged findings (2026-07-30)

| Finding | Severity | Triage | Rationale |
|---|---|---|---|
| `next` 14.x server CVEs (DoS, SSRF, cache poisoning, middleware bypass — ~20 advisories) | High | **Accepted (not exploitable)** | All target the Next server runtime, which never runs in production (static export). Only fix is the breaking Next 16 upgrade — tracked as future work. |
| `postcss` XSS/path-traversal advisories | High | **Accepted (build-time only)** | PostCSS runs at build time on our own CSS; it processes no untrusted input at runtime. |

### Triage rules

1. Any **critical** finding: fix or remove the dependency before merging.
2. Any **high** finding in code that executes in production with untrusted
   input: treat as critical.
3. High findings in build-time-only or non-executing code paths: document
   in the table above with rationale; revisit each dependency upgrade.
4. Re-run triage whenever the deployment model changes (e.g. if the
   frontend ever moves off static export, all `next` server CVEs become
   live and the accepted entries above are void).

## Authentication model (current)

- Short-lived JWT (2h, HS256, `jti`) issued on login; httpOnly `SameSite=Strict`
  cookie plus an in-memory copy for the SPA — never persisted to browser storage.
- `POST /api/auth/refresh` rotates the cookie and returns a fresh token.
- `POST /api/auth/logout` revokes the presented token's `jti` server-side
  (`revoked_tokens` table); all auth middleware rejects revoked tokens.
- Account lockout after 5 failed logins per email+IP (15 min window).
- Known limitation: lockout and rate-limit state are process-local; they
  reset on restart and do not synchronize across instances.

## Operational backups

`cd backend && npm run backup` snapshots the SQLite database (using the
online backup API — safe while the server runs) to `backend/backups/`.
On ephemeral hosting this protects against operator error only, not host
loss; copy snapshots off-host for real durability.
