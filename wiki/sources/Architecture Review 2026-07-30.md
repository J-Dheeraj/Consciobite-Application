---
type: source
title: "External Architecture Review 2026-07-30 (Second Review)"
created: 2026-07-30
status: permanent
tags: [source, architecture-review, security, scalability, production-readiness]
---

# External Architecture Review — 2026-07-30

**Date:** 2026-07-30
**Source type:** External architecture/security review (second of two)
**Reviewed commit:** `main` @ `2cb26e9` (after B2B transformation, ML layer, and tier-1/tier-2 review fixes)
**Raw document:** `.raw/architecture-review-2026-07-30.md`
**Previous review:** `main` @ `9914b96`, scored 5/10, classification "Prototype" (2026-07-29, not separately ingested — its findings drove the tier-1/tier-2 fix commits `2bd6790` and `6f69df0`)

---

## Verdict

- **Score: 6/10** (up from 5/10)
- **Classification: Pilot-ready** — controlled, disposable-data pilot only
- **Enterprise deployment: No**
- Reviewer independently verified: CI green (all 3 jobs), live frontend 200, live `/api/health` reporting all checks true

## Acknowledged as fixed (from first review)

1. Refresh/logout production origin bug (was hitting frontend origin)
2. `trust proxy` for real client IPs behind Render
3. Health endpoint now checks DB writability, migrations, scoring, ML artifacts
4. Open Food Facts: retry + backoff, 503 vs 404 distinction
5. Audit actor/reason attribution (`admin:<email>`, `system:startup`, non-null reason)
6. "Immutable"/"regulatory-ready" claims corrected to accurate descriptions
7. Frontend test suite exists and runs in CI
8. Frontend audit gate at `--audit-level=critical` instead of `|| true`

## Remaining critical blockers

1. **Ephemeral SQLite on Render free tier** — no persistent disk; redeploy can erase users, reviews, carbon history, manufacturers, audit records. The decisive blocker.
2. **JWT still in `localStorage`** (and returned in response body) — XSS can steal a reusable token; the httpOnly cookie doesn't protect the duplicate.
3. **Logout doesn't revoke tokens** — no `jti`, session records, or refresh rotation.
4. **Process-local security state** — rate limits and lockout reset on restart, diverge across instances.
5. **No backup/restore, monitoring, alerting, or DR evidence.**
6. **Branch protection absent** — PR 42 merged 10 seconds after creation, before its CI finished. Required status checks not enforced on `main`.

## Notable new findings (not in first review)

- **Sentry is miswired**: frontend reads `REACT_APP_SENTRY_DSN` (a CRA-era var Next.js never exposes — needs `NEXT_PUBLIC_` prefix) and `initSentry()` appears to never be invoked.
- Migration health check only proves ≥1 migration exists, not that all expected ones applied.
- Worst-case OFF lookup latency ~31s (3 attempts × 10s timeout + backoff); no circuit breaker.
- Carbon purchase history should be classified as personal behavioural data (privacy).

## Strategic guidance

Business value now lies in **evidence ingestion, provenance/versioning, controlled score publication, and repeatable exports** — not more ML. Recommended target architecture: static frontend + stateless Express + managed PostgreSQL + object storage for evidence/artifacts + background workers + central observability. Explicitly: no microservices/Kubernetes/event streaming needed yet.

## Connections

- Fix commits driven by review #1: `2bd6790` (tier 1), `6f69df0` (tier 2) — see [[Production Readiness]]
- Governance gaps relate to [[Grading Independence Governance]] — audit rows mutable, fee acknowledgement a mutable Boolean, panel workflows documentary not enforced
- Persistence blocker relates to [[Stack Migration Plan]] (Postgres migration already planned but unscheduled; CLAUDE.md requires discussion before migrating)
- Security findings extend [[Backend Security]]
