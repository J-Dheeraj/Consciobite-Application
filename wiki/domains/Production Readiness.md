---
type: domain
title: "Production Readiness"
created: 2026-07-30
updated: 2026-11-28
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
| No frontend tests; audit gate `\|\| true` | jest + testing-library suite in CI; audit gate `--audit-level=critical` (Next 14 high CVEs are server-side; static export unaffected; fix = breaking Next 16, done 2026-11-28, which cleared them, so the gate now has no exceptions) |

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

1. **Ephemeral SQLite: resolved 2026-11-27, without Postgres.** Production runs on a Turso embedded replica (`backend/src/db/driver.js`, setup in `backend/docs/turso.md`): writes go to Turso's hosted primary and survive redeploys. `/api/health` reports `storage`, and the live smoke test fails unless it is `turso` (the live API reported `turso` on 2026-11-28). Postgres is no longer needed to stop data loss, so any move to it needs a different reason. See [[Stack Migration Plan]].
2. **Process-local rate limit/lockout/cache** — Redis when (and only when) multi-instance.
3. **Backups/DR: covered by Turso.** Its point-in-time restore survives host loss; `npm run backup` only snapshots the local file.
4. **Branch protection not enforced** — cannot be set from the dev environment (no repo-admin token); requires GitHub UI: Settings → Branches → protect `main` with required status checks.
5. Catalogue-as-committed-JSON blocks manufacturer onboarding; needs relational product/evidence tables with versioning.
6. Tamper-evident audit storage (chaining/signatures/external checkpoint) still roadmap.

## Reviewer's strategic steer

More ML is not the priority. Value = evidence ingestion, provenance/versioning, controlled score publication, repeatable exports. Target architecture: static frontend + stateless API + managed Postgres + object storage + background workers + central observability. No microservices/K8s.
