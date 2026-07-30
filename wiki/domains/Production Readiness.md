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

## Open blockers (tier 3 — each needs a scoping decision)

1. **Ephemeral SQLite** — Render free tier, no persistent disk; redeploy can erase all business data. Fix: managed PostgreSQL (CLAUDE.md forbids migrating without discussion; Render free Postgres expires after 90 days → effectively a paid decision; better-sqlite3 sync → pg async touches every route). See [[Stack Migration Plan]].
2. **JWT in `localStorage` + response body** — XSS-stealable; preferred: httpOnly session cookie, short-lived access token in memory, rotating refresh tokens, server-side revocation. Own PR; changes felt session behavior.
3. **No token revocation on logout** — needs `jti`/session records; depends on item 2.
4. **Process-local rate limit/lockout/cache** — Redis when (and only when) multi-instance.
5. **No backup/restore/DR, monitoring, alerting** — depends on item 1 for anything meaningful.
6. **Branch protection not enforced** — PR 42 merged before its CI finished. Repo-settings change (required status checks), not a code change.

## Newer findings to pick up (from review #2)

- **Sentry miswired**: `REACT_APP_SENTRY_DSN` is never exposed by Next.js (needs `NEXT_PUBLIC_` prefix) and `initSentry()` appears uninvoked — monitoring is silently absent.
- Migration health check should verify the exact expected migration set, not `count > 0`.
- OFF worst case ~31s; add circuit breaker + concurrency cap.
- Catalogue-as-committed-JSON blocks manufacturer onboarding; needs relational product/evidence tables with versioning.
- Privacy program absent: retention, deletion, export, consent, log redaction; carbon history = behavioural personal data.

## Reviewer's strategic steer

More ML is not the priority. Value = evidence ingestion, provenance/versioning, controlled score publication, repeatable exports. Target architecture: static frontend + stateless API + managed Postgres + object storage + background workers + central observability. No microservices/K8s.
