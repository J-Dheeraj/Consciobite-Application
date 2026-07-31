---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-07-31
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-07-31 after score-history + recommendations feature on `claude/nifty-goodall-2ge1iu`.

**Project:** Consciobite — Next.js 14 App Router (static export) + Node.js/Express API + SQLite. **Repositioned as B2B**: SKU-level carbon scoring + Digital Product Passport platform for food FMCG brands (SGX Scope 3 / EU ESPR framing). GreenGrade v3 scores 550 products 0–10 via KDE + sigmoid across 7 emission dimensions.

**B2B layer (2026-07):** `/api/v1/passport/:id`, `POST /api/v1/portfolio/score` (≤100 SKUs), `/api/v1/audit/:id` in `backend/src/routes/passport.js`. `METHODOLOGY.md` at repo root. README rewritten for B2B (no student-project framing).

**ML insights layer (2026-07-30):** Course-aligned, advisory-only `/api/v1/ml/*` (similar/classify/estimate-emissions/clusters) — scikit-learn trained offline (`ml/greengrade_ml_analysis.py`), artifacts in `backend/src/data/ml_artifacts.json`, evaluated in plain JS (`backend/src/services/mlInsights.js`). Never touches scores/categories or audit trail. `ML_REPORT.md` = course report with real numbers from sklearn + NumPy reference runs. K-Means k=2 rediscovers animal/plant divide (silhouette 0.472); deployed classifiers are decision trees (auditability > accuracy).

**Two external architecture reviews:**
- #1 (2026-07-29, `main@9914b96`): 5/10 "Prototype".
- #2 (2026-07-30, `main@2cb26e9`): **6/10 "Pilot-ready"** — disposable-data pilots only, enterprise: no. See [[Architecture Review 2026-07-30]] and [[Production Readiness]].

**Review-#1 fixes landed** (`2bd6790` tier 1, `6f69df0` tier 2): AuthContext refresh/logout now use `API_BASE` (was silently broken in prod — hit frontend origin); `trust proxy 1`; deep `/api/health` (DB writability via BEGIN IMMEDIATE, migrations, scoring, ML artifacts; 503 when degraded); OFF lookup retry+backoff with 503-vs-404 distinction; audit attribution (`admin:<email>`, `system:startup`, reason never null); "immutable"/"ESPR-ready" claims reworded; frontend jest suite wired into CI; frontend audit gate `--audit-level=critical` (Next 14 high CVEs are server-side; static export unaffected; fix requires breaking Next 16).

**Review-#2 fixes landed** (`af395ee`): access token memory-only (never localStorage; cookie-based session restore, `initializing` state); `jti` revocation registry (migration 003) — logout revokes, refresh rotates; Sentry actually wired (`NEXT_PUBLIC_SENTRY_DSN` + `initSentry()` invoked); X-Request-Id tracing; `/api/health/live` + exact migration-set readiness; OFF circuit breaker (3 fails → 60s open); privacy controls (`GET /auth/export`, `DELETE /auth/account`, `PRIVACY.md`); score provenance (methodology version + catalog sha256 + code revision per change); `SECURITY.md` triage policy; `NEXT_PUBLIC_API_URL` precedence; ROUTE_TABLE consolidation; `npm run backup`. See [[Production Readiness]].

**Also fixed earlier:** `swagger-jsdoc` removed (unpatchable brace-expansion chain; spec inline). Backend prod audit = 0 vulns. `trailingSlash: true` fixed static-hosting 404s. `ApiReadyGate` cold-start UX. Backend Dockerfile: `apk add python3 make g++` for better-sqlite3 on Alpine (2026-07-17, was blocking PR #34's Docker check).

**Parallel work on main:** DPP passport frontend page in PR #34 (branch `claude/dreamy-dirac-fzmsdt`); `CONTRIBUTING.md` added via `claude/nifty-goodall-s4f427`.

**Open blockers (infrastructure decisions):** ephemeral SQLite on Render free tier (THE blocker; CLAUDE.md requires discussion before Postgres); process-local rate-limit/lockout (Redis when multi-instance); no managed backups/DR or metrics+alerting beyond Sentry; branch protection absent (needs GitHub UI — API token can't set it); catalogue-as-JSON blocks manufacturer onboarding; tamper-evident audit storage still roadmap. Reviewer steer: evidence ingestion/provenance > more ML.

**Test status:** 185 backend + 9 frontend, all passing. Frontend builds 569 static pages.

**Active branch:** `claude/nifty-goodall-2ge1iu` — commit `771cb77`: score history + recommendations endpoints + product detail UI cards.

**New in 2026-07-31 (commit `771cb77`):**
- `GET /api/products/:id/score-history` — public audit-trail endpoint. Returns changedAt, oldScore, newScore, delta, changeReason, methodologyVersion. Redacts manufacturer, paying-status, changedBy, catalog_hash. 
- `GET /api/products/:id/recommendations` — up to 6 same-category peers sorted by score descending, self-excluded. Activates the already-present `fetchRecommendations()` frontend service.
- 12 new Supertest tests (5 score-history + 7 recommendations) → total 185.
- Product detail page gains "Score History" and "Similar Products" cards via React Query parallel fetches.
- Directly addresses reviewer steer "evidence ingestion/provenance > more ML".

**Key invariants:**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- JWT: httpOnly cookie + memory-only copy (never localStorage, as of 2026-07-30); logout revokes via `jti`; CSRF double-submit on mutating routes
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
- ML endpoints advisory-only; never write scores/categories or bypass audit log
