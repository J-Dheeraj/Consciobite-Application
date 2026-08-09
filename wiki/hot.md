---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-08-09
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-08-09 — Evidence Registry frontend connected (branch `claude/nifty-goodall-5s3n4m`, commit `d917415`). All previous open PRs are now merged into main.

**Project:** Consciobite — Next.js 14 App Router (static export) + Node.js/Express API + SQLite. **Repositioned as B2B**: SKU-level carbon scoring + Digital Product Passport platform for food FMCG brands (SGX Scope 3 / EU ESPR framing). GreenGrade v3 scores 550 products 0–10 via KDE + sigmoid across 7 emission dimensions.

**B2B layer (2026-07):** `/api/v1/passport/:id`, `POST /api/v1/portfolio/score` (≤100 SKUs), `/api/v1/audit/:id` in `backend/src/routes/passport.js`. `METHODOLOGY.md` at repo root. README rewritten for B2B (no student-project framing).

**ML insights layer (2026-07-30):** Course-aligned, advisory-only `/api/v1/ml/*` (similar/classify/estimate-emissions/clusters) — scikit-learn trained offline (`ml/greengrade_ml_analysis.py`), artifacts in `backend/src/data/ml_artifacts.json`, evaluated in plain JS (`backend/src/services/mlInsights.js`). Never touches scores/categories or audit trail. `ML_REPORT.md` = course report with real numbers from sklearn + NumPy reference runs. K-Means k=2 rediscovers animal/plant divide (silhouette 0.472); deployed classifiers are decision trees (auditability > accuracy).

**Two external architecture reviews:**
- #1 (2026-07-29, `main@9914b96`): 5/10 "Prototype".
- #2 (2026-07-30, `main@2cb26e9`): **6/10 "Pilot-ready"** — disposable-data pilots only, enterprise: no. See [[Architecture Review 2026-07-30]] and [[Production Readiness]].

**All review fixes landed.** Both tier-1/tier-2 review fixes are on main. Access token memory-only, jti revocation, Sentry wired, X-Request-Id tracing, deep health check, OFF circuit breaker, privacy controls, score provenance, SECURITY.md — all live on main.

**Evidence registry (2026-07-30, merged):** Persistent, admin-extensible evidence source registry. Migration 007: `evidence_sources` table seeded with 4 canonical sources (Poore & Nemecek 2018, Our World in Data, Open Food Facts, category-estimate) + `product_evidence_links` for explicit product–source bindings. Routes: `GET /api/v1/evidence/sources`, `GET /api/v1/evidence/sources/:key`, `GET /api/v1/evidence/product/:id`, `POST /api/v1/evidence/sources` (admin), `POST /api/v1/evidence/product-link` (admin). 14 tests.

**Evidence Registry frontend (2026-08-09, commit `d917415`):** The methodology page (`/methodology`) now has a live "Evidence Registry" section fetching from `/api/v1/evidence/sources` via React Query. Reliability filter pills (All / High / Medium / Low) allow users to filter the live DB-backed sources. `fetchEvidenceSources({ reliability? })` added to `frontend/src/services/products.js` and exported from `frontend/src/services/api.js`. Directly addresses architecture reviewer's "evidence ingestion/provenance > more ML" feedback. No new backend code required.

**Currently on branch:** `claude/nifty-goodall-5s3n4m` — 1 commit ahead of main.

**All previous open PRs now merged:** #34 DPP frontend, #36 recommendations, #37 tier filter + carbon widget, #38 user profile, #39 CSV export, #41 server-side favorites, #44 evidence registry, #45 community evidence submission, #47 README sync. No open PRs.

**Merged features list:**
- Passport page `/passport/[id]` with SVG score ring + 7-dimension bars
- Similar products recommendations on product detail
- Tier filter (`?tier=green|amber|red`) on products page
- User profile with weekly goal slider
- Carbon CSV export
- Server-side favorites (with guest localStorage fallback)
- Community evidence submission with admin approval workflow
- Admin-extensible evidence source registry

**Open blockers (infrastructure decisions):** ephemeral SQLite on Render free tier (THE blocker; CLAUDE.md requires discussion before Postgres); process-local rate-limit/lockout (Redis when multi-instance); no managed backups/DR or metrics+alerting beyond Sentry; catalogue-as-JSON blocks manufacturer onboarding; tamper-evident audit storage still roadmap.

**Migration sequence (main):** 001 initial, 002 governance, 003 revocation+provenance, 004 favorites, 005 user profile, 006 submitted evidence, 007 evidence sources.

**Test status:** 249 backend + 9 frontend, all passing. Frontend builds 1119 static pages (550 product + 550 passport + routes).

**Key invariants:**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- JWT: httpOnly cookie + memory-only copy (never localStorage, as of 2026-07-30); logout revokes via `jti`; CSRF double-submit on mutating routes
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
- ML endpoints advisory-only; never write scores/categories or bypass audit log
