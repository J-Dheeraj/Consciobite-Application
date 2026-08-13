---
type: domain
title: "Production Readiness"
created: 2026-07-30
status: developing
tags: [domain, production-readiness, security, scalability, reliability]
---

# Production Readiness

Cross-cutting tracking of what separates the current deployment from production/enterprise grade. Grounded in two external architecture reviews (2026-07-29 scored 5/10 "Prototype"; 2026-07-30 scored 6/10 "Pilot-ready" — see [[Architecture Review 2026-07-30]]).

---

## Current state (2026-07-30)

**Pilot-ready for disposable-data pilots only.** CI green, live health checks pass, but real user/manufacturer/regulatory data must not be collected yet.

## Fixed in response to review #1 (commits `2bd6790`, `6f69df0`)

| Fix | Where |
|---|---|
| Refresh/logout used frontend origin in production (auth silently broken) | `frontend/src/context/AuthContext.js` now uses `API_BASE` |
| Rate limit/lockout keyed on proxy IP | `app.set("trust proxy", 1)` in `backend/src/index.js` |
| Shallow health check | `/api/health` verifies DB writability (`BEGIN IMMEDIATE`), migrations, scoring, ML artifacts; 503 when degraded |
| Upstream outage masqueraded as 404 | OFF lookup: 2 retries w/ backoff, `found`/`not_found`/`unavailable` result, 503 on outage |
| Nullable/unattributed audit rows | `admin:<email>` + reason on rescore, `system:startup` on drift, reason never null |
| Overstated claims ("immutable", "ready for ESPR") | README/Swagger reworded to accurate descriptions |
| No frontend tests; audit gate `\|\| true` | jest + testing-library suite in CI; audit gate `--audit-level=critical` (Next 14 high CVEs are server-side; static export unaffected; fix = breaking Next 16) |

## Fixed in response to review #2 (2026-07-30)

| Fix | Where |
|---|---|
| JWT in localStorage (XSS-stealable) | Token now memory-only (`httpClient.setAuthToken`); session restore via httpOnly cookie → `/auth/refresh` on mount; `initializing` state prevents signed-out flash |
| No revocation on logout | JWTs carry `jti`; `revoked_tokens` table (migration 003); logout revokes; all auth middleware rejects revoked tokens; refresh rotates |
| Sentry miswired | `NEXT_PUBLIC_SENTRY_DSN` + `initSentry()` invoked in Providers |
| Shallow migration check | Health verifies the exact expected migration file set |
| No liveness/readiness split | `/api/health/live` (liveness) vs `/api/health` (readiness) |
| No request tracing | X-Request-Id honored/minted, echoed, logged |
| OFF ~31s worst case | Circuit breaker: opens after 3 consecutive failures, 60s cooldown, half-open probe |
| No privacy controls | `GET /auth/export`, `DELETE /auth/account` (password-confirmed, transactional), `PRIVACY.md` |
| Score records unbound from inputs | `methodology_version`, `catalog_hash` (sha256 of products.json), `code_revision` on every score change |
| No dependency triage policy | `SECURITY.md` with per-finding triage table |
| Hostname inference | `NEXT_PUBLIC_API_URL` now takes precedence in `getApiBase()` |
| Duplicate route registration | Single ROUTE_TABLE mounts both /api and /api/v1 |
| No backup tooling | `npm run backup` (SQLite online backup API) |

## Open blockers (infrastructure decisions)

1. **Ephemeral SQLite** — Render free tier, no persistent disk; redeploy can erase all business data. Fix: managed PostgreSQL (CLAUDE.md forbids migrating without discussion; Render free Postgres expires after 90 days → effectively a paid decision; better-sqlite3 sync → pg async touches every route). See [[Stack Migration Plan]].
2. **Process-local rate limit/lockout/cache** — Redis when (and only when) multi-instance.
3. **No managed backups/DR** — `npm run backup` exists but snapshots die with the host; depends on item 1 for anything meaningful.
4. **Branch protection not enforced** — cannot be set from the dev environment (no repo-admin token); requires GitHub UI: Settings → Branches → protect `main` with required status checks.
5. Catalogue-as-committed-JSON blocks manufacturer onboarding; needs relational product/evidence tables with versioning.
6. Tamper-evident audit storage (chaining/signatures/external checkpoint) still roadmap.

## Reviewer's strategic steer

More ML is not the priority. Value = evidence ingestion, provenance/versioning, controlled score publication, repeatable exports. Target architecture: static frontend + stateless API + managed Postgres + object storage + background workers + central observability. No microservices/K8s.

## Progress against reviewer steer (2026-08-13)

| Priority | Status | Details |
|---|---|---|
| Evidence ingestion | ✓ Done | Evidence source registry (PR #44) + community submission (PR #45) |
| Provenance/versioning | ✓ Done | methodology_version, catalog_hash, code_revision per score change (review #2 fixes) |
| Controlled score publication | ✓ Done | Migration 008, `scorePublication.js`, admin API, DPP passport fields (`claude/dreamy-dirac-w3parn`) |
| Repeatable exports | ⚪ Partial | Carbon CSV export done (PR #39); B2B portfolio export not yet scoped |
