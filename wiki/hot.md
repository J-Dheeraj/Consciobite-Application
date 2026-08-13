---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-08-13
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-08-13 — product catalog migrated from static JSON to SQLite (branch `claude/nifty-goodall-gw042u`, commit `b698b64`). All prior open PRs (#34/#36/#37/#38/#39/#41/#44/#45/#46/#47) are merged.

**Project:** Consciobite — Next.js 14 App Router (static export) + Node.js/Express API + SQLite. **Repositioned as B2B**: SKU-level carbon scoring + Digital Product Passport platform for food FMCG brands (SGX Scope 3 / EU ESPR framing). GreenGrade v3 scores 550 products 0–10 via KDE + sigmoid across 7 emission dimensions.

**B2B layer (2026-07):** `/api/v1/passport/:id`, `POST /api/v1/portfolio/score` (≤100 SKUs), `/api/v1/audit/:id` in `backend/src/routes/passport.js`. `METHODOLOGY.md` at repo root. README rewritten for B2B (no student-project framing).

**ML insights layer (2026-07-30):** Course-aligned, advisory-only `/api/v1/ml/*` (similar/classify/estimate-emissions/clusters) — scikit-learn trained offline (`ml/greengrade_ml_analysis.py`), artifacts in `backend/src/data/ml_artifacts.json`, evaluated in plain JS (`backend/src/services/mlInsights.js`). Never touches scores/categories or audit trail. `ML_REPORT.md` = course report with real numbers from sklearn + NumPy reference runs. K-Means k=2 rediscovers animal/plant divide (silhouette 0.472); deployed classifiers are decision trees (auditability > accuracy).

**Two external architecture reviews:**
- #1 (2026-07-29, `main@9914b96`): 5/10 "Prototype".
- #2 (2026-07-30, `main@2cb26e9`): **6/10 "Pilot-ready"** — disposable-data pilots only, enterprise: no. See [[Architecture Review 2026-07-30]] and [[Production Readiness]].

**Review-#1 fixes landed** (`2bd6790` tier 1, `6f69df0` tier 2): AuthContext refresh/logout now use `API_BASE` (was silently broken in prod — hit frontend origin); `trust proxy 1`; deep `/api/health` (DB writability via BEGIN IMMEDIATE, migrations, scoring, ML artifacts; 503 when degraded); OFF lookup retry+backoff with 503-vs-404 distinction; audit attribution (`admin:<email>`, `system:startup`, reason never null); "immutable"/"ESPR-ready" claims reworded; frontend jest suite wired into CI; frontend audit gate `--audit-level=critical` (Next 14 high CVEs are server-side; static export unaffected; fix requires breaking Next 16).

**Review-#2 fixes landed** (`af395ee`): access token memory-only (never localStorage; cookie-based session restore, `initializing` state); `jti` revocation registry (migration 003) — logout revokes, refresh rotates; Sentry actually wired (`NEXT_PUBLIC_SENTRY_DSN` + `initSentry()` invoked); X-Request-Id tracing; `/api/health/live` + exact migration-set readiness; OFF circuit breaker (3 fails → 60s open); privacy controls (`GET /auth/export`, `DELETE /auth/account`, `PRIVACY.md`); score provenance (methodology version + catalog sha256 + code revision per change); `SECURITY.md` triage policy; `NEXT_PUBLIC_API_URL` precedence; ROUTE_TABLE consolidation; `npm run backup`. See [[Production Readiness]].

**Also fixed earlier:** `swagger-jsdoc` removed (unpatchable brace-expansion chain; spec inline). Backend prod audit = 0 vulns. `trailingSlash: true` fixed static-hosting 404s. `ApiReadyGate` cold-start UX. Backend Dockerfile: `apk add python3 make g++` for better-sqlite3 on Alpine (2026-07-17, was blocking PR #34's Docker check).

**Evidence registry (2026-07-30, commit `32d27eb`):** Persistent, admin-extensible evidence source registry directly addressing review-#2 steer ("evidence ingestion/provenance > more ML"). Migration 007: `evidence_sources` table seeded with 4 canonical sources (Poore & Nemecek 2018, Our World in Data, Open Food Facts, category-estimate) + `product_evidence_links` for explicit product–source bindings. New v1-only routes in `backend/src/routes/evidence.js`: `GET /api/v1/evidence/sources`, `GET /api/v1/evidence/sources/:key`, `GET /api/v1/evidence/product/:id`, `POST /api/v1/evidence/sources` (admin), `POST /api/v1/evidence/product-link` (admin). Swagger: `EvidenceSource` schema + 5 endpoints under "Evidence & Provenance" tag. 14 new tests.

**Parallel work on main:** DPP passport frontend page in PR #34 (branch `claude/dreamy-dirac-fzmsdt`); `CONTRIBUTING.md` added via `claude/nifty-goodall-s4f427`.

**Open PRs:** None — all prior PRs are merged. Current work is on `claude/nifty-goodall-gw042u` (product catalog SQLite migration, not yet PR'd).

**Passport frontend (PR #34, branch `claude/dreamy-dirac-fzmsdt`):** `/passport/[id]` page with `PassportCard` (SVG score ring, 7-dimension emission bars, confidence badge, methodology version); `fetchPassport`/`fetchPortfolioScore`/`fetchAuditLog` in the products service; "Eco Passport" button on the product detail page; 550 pages via `generateStaticParams()`.

**Similar Products UI (PR #36, branch `claude/dreamy-dirac-4ua0hn`):** `GET /api/products/:id/recommendations` returns up to 6 same-category products by GreenGrade descending; rendered as a "Similar Products" card list on the product detail page. Distinct from `/api/v1/ml/similar` (cosine similarity over emission vectors, greener-only) — see the note above; both are kept deliberately.

**Tier filter + carbon widget (PR #37, branch `claude/dreamy-dirac-6st5cb`):** `?tier=green|amber|red` on `GET /api/products` (green ≥7, amber 4–7, red <4; unknown values pass through) with pill buttons on the products page; authenticated dashboard shows a weekly carbon progress card. The PR's original `npm audit fix` lockfile change was dropped as superseded — main removed swagger-jsdoc instead.

**User profile (PR #38, branch `claude/nifty-goodall-1w4m1h`):** `PATCH /api/auth/me` (CSRF + auth gated) updates name and `weeklyGoal`; migration **005** adds `weekly_carbon_goal REAL DEFAULT 10.0`. `/profile` page with goal slider; carbon tracker reads the personal goal, falling back to `WEEKLY_CARBON_GOAL_KG`. Navbar name links to the profile.

**Carbon CSV export (PR #39, branch `claude/nifty-goodall-juod2y`):** `GET /api/carbon/export` (auth-required) returns an RFC 4180 CSV of the user's logs with a `Content-Disposition` attachment header. `downloadCarbonExport()` uses a raw fetch for the blob but takes its bearer token from `getAuthHeaders()` (memory), never localStorage. "Export CSV" button on the carbon page, hidden when there are no logs.

**Server-side favorites (PR #41, branch `claude/nifty-goodall-cavczb`):** `user_favorites` table (migration **004**) with `UNIQUE(user_id, product_id)` and cascade delete; `/api/favorites` GET/POST plus DELETE `/all` and `/:productId`, mounted via ROUTE_TABLE. Favorites page reads from the server via React Query when authenticated and falls back to localStorage for guests (favorites data only — never auth tokens).

**Product catalog SQLite migration (2026-08-13):** `catalog_products` table (migration 008) stores full product JSON in `product_data` column + denormalised indexed columns (name, brand, category, barcode, is_active). `productService.js` provides a SQLite-backed in-memory enriched cache: `seedFromJson()` seeds the table from `products.json` on first startup; `loadCache()` rebuilds the cache from SQLite; any admin write (create/update/softDelete) calls `loadCache()` + `invalidateHttpCache("/products")` so changes are live immediately. Admin CRUD: `GET/POST /api/admin/products` + `PATCH/DELETE /api/admin/products/:id`. 22 new integration tests (249 → 271 total). Swagger "Product Catalog" tag added. Migration sequence: 001–008 complete.

**Open blockers (infrastructure decisions):** ephemeral SQLite on Render free tier (THE blocker; CLAUDE.md requires discussion before Postgres); process-local rate-limit/lockout (Redis when multi-instance); no managed backups/DR or metrics+alerting beyond Sentry; ~~catalogue-as-JSON~~ **RESOLVED** (product catalog now in SQLite via migration 008); tamper-evident audit storage still roadmap.

**Community evidence submission (PR #45, branch `claude/dreamy-dirac-2jgkme`):** the *contribution* half of the evidence story (the registry above is the *curation* half — they are complementary, not duplicates). `POST /api/products/:id/evidence` (auth required) accepts citation, source_type, methodology, url, year; submissions land in `submitted_evidence` (migration **006**) as pending. Admins approve/reject via `GET /api/admin/pending-evidence` and `POST /api/admin/evidence/:id/review`; approved entries surface through `GET /api/products/:id/evidence` and the `EvidenceSection` component. `csrfProtection` added to the products router.

**Migration sequence (unique across all open branches):** 001 initial, 002 governance, 003 revocation+provenance, 004 favorites (PR #41), 005 user profile (PR #38), 006 submitted evidence (PR #45), 007 evidence sources (merged PR #44).

**Test status:** 271 backend + 9 frontend, all passing. Frontend builds 1119 static pages (550 product + 550 passport + routes).

**Key invariants:**
- `AUTH_EXPIRED_EVENT` constant for 401 event bus (never raw string)
- `WEEKLY_CARBON_GOAL_KG` in `frontend/src/utils/constants.js`
- `/carbon` protected by `RequireAuth` — no in-page auth gates
- JWT: httpOnly cookie + memory-only copy (never localStorage, as of 2026-07-30); logout revokes via `jti`; CSRF double-submit on mutating routes
- All Express routes use `validate()` middleware with `pattern:` not `type: "number"`
- ML endpoints advisory-only; never write scores/categories or bypass audit log
