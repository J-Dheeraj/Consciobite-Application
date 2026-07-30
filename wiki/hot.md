---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-07-30
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-07-30 after second external architecture review ingest.

**Project:** Consciobite — Next.js 14 App Router (static export) + Node.js/Express API + SQLite. **Repositioned as B2B**: SKU-level carbon scoring + Digital Product Passport platform for food FMCG brands (SGX Scope 3 / EU ESPR framing). GreenGrade v3 scores 550 products 0–10 via KDE + sigmoid across 7 emission dimensions.

**B2B layer (2026-07):** `/api/v1/passport/:id`, `POST /api/v1/portfolio/score` (≤100 SKUs), `/api/v1/audit/:id` in `backend/src/routes/passport.js`. `METHODOLOGY.md` at repo root. README rewritten for B2B (no student-project framing).

**ML insights layer (2026-07-30):** Course-aligned, advisory-only `/api/v1/ml/*` (similar/classify/estimate-emissions/clusters) — scikit-learn trained offline (`ml/greengrade_ml_analysis.py`), artifacts in `backend/src/data/ml_artifacts.json`, evaluated in plain JS (`backend/src/services/mlInsights.js`). Never touches scores/categories or audit trail. `ML_REPORT.md` = course report with real numbers from sklearn + NumPy reference runs. K-Means k=2 rediscovers animal/plant divide (silhouette 0.472); deployed classifiers are decision trees (auditability > accuracy).

**Two external architecture reviews:**
- #1 (2026-07-29, `main@9914b96`): 5/10 "Prototype".
- #2 (2026-07-30, `main@2cb26e9`): **6/10 "Pilot-ready"** — disposable-data pilots only, enterprise: no. See [[Architecture Review 2026-07-30]] and [[Production Readiness]].

**Review fixes landed** (`2bd6790` tier 1, `6f69df0` tier 2): AuthContext refresh/logout now use `API_BASE` (was silently broken in prod — hit frontend origin); `trust proxy 1`; deep `/api/health` (DB writability via BEGIN IMMEDIATE, migrations, scoring, ML artifacts; 503 when degraded); OFF lookup retry+backoff with 503-vs-404 distinction; audit attribution (`admin:<email>`, `system:startup`, reason never null); "immutable"/"ESPR-ready" claims reworded; frontend jest suite (6 tests) wired into CI; frontend audit gate `--audit-level=critical` (Next 14 high CVEs are server-side; static export unaffected; fix requires breaking Next 16).

**Also fixed:** `swagger-jsdoc` removed entirely (unpatchable brace-expansion chain; spec was inline anyway — `swaggerSpec = options.definition`). Backend `npm audit --production --audit-level=high` = 0 vulns. `trailingSlash: true` fixed static-hosting 404s. Cold-start UX: `ApiReadyGate` polls `/api/health`, shows "Waking up the server...".

**Open blockers (tier 3, each needs scoping decision):** ephemeral SQLite on Render free tier (THE blocker — no persistent disk, redeploy erases data; CLAUDE.md requires discussion before Postgres); JWT in localStorage (XSS-stealable) + no revocation on logout; process-local rate-limit/lockout; no backup/DR/monitoring; branch protection absent (PR 42 merged before CI finished); **Sentry miswired** (`REACT_APP_SENTRY_DSN` never exposed by Next.js; `initSentry()` uninvoked). Reviewer steer: evidence ingestion/provenance > more ML.

**Test status:** 161 backend + 6 frontend, all passing. Frontend builds 569 static pages.

**Active branch:** `claude/improve-application-S5njo` — merged to `main` through `2cb26e9`.

**Key invariants:**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- JWT: httpOnly cookie + memory-only copy (never localStorage, as of 2026-07-30); logout revokes via `jti`; CSRF double-submit on mutating routes
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
- ML endpoints advisory-only; never write scores/categories or bypass audit log
