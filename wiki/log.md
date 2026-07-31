---
type: meta
title: "Operation Log"
created: 2026-04-25
updated: 2026-07-30
status: evergreen
tags: [log, meta]
---

# Operation Log

Append-only. Newest entries at top.

---

## 2026-07-30 — Evidence Source Registry

**Operation:** Implement evidence source registry (migration 007 + `/api/v1/evidence/*` routes), addressing architecture review-#2 steer "evidence ingestion/provenance > more ML".

**Files created:** 3
- `backend/src/db/migrations/007_evidence_sources.sql` — `evidence_sources` table (seeded with 4 canonical sources) + `product_evidence_links` table
- `backend/src/routes/evidence.js` — 5 endpoints (3 public GET + 2 admin-only POST)
- `backend/__tests__/evidence.test.js` — 14 integration tests

**Files updated:** 2
- `backend/src/index.js` — mount `evidenceRoutes` at `/api/v1/evidence`
- `backend/src/swagger.js` — `EvidenceSource` schema + Evidence & Provenance tag with all 5 endpoints

**Test count:** 173 → 187 backend (all passing). 14 new tests cover source listing, reliability filter, per-key lookup, per-product provenance, 401 enforcement on admin routes.

**Branch:** `claude/nifty-goodall-zt4vpf`, commit `32d27eb`
**Hot cache updated:** yes

---

## 2026-07-30 — Community Evidence Submission Feature

**Operation:** Implement community evidence submission with admin review workflow on branch `claude/dreamy-dirac-2jgkme`.

**Files created:** 3
- `backend/src/db/migrations/006_submitted_evidence.sql` — new table: submitted_evidence (product_id, citation, source_type, methodology, url, year, status pending/approved/rejected, reviewer fields)
- `backend/src/services/evidenceService.js` — submitEvidence, getApprovedEvidence, getPendingEvidence, reviewEvidence
- `frontend/src/components/EvidenceSection.js` — shows approved community citations, form for authenticated users, sign-in prompt for anonymous

**Files modified:** 7
- `backend/src/routes/products.js` — GET/POST /api/products/:id/evidence (public list + auth-gated submit)
- `backend/src/routes/admin.js` — GET /admin/pending-evidence + POST /admin/evidence/:id/review
- `backend/src/index.js` — csrfProtection added to products router entry (POST routes now protected)
- `backend/__tests__/api.test.js` — 8 new Supertest tests (181 total, all passing)
- `frontend/src/services/products.js` — fetchProductEvidence, submitProductEvidence
- `frontend/src/services/api.js` — exported new service functions
- `frontend/src/app/product/[id]/ProductDetailClient.js` — added EvidenceSection component

**Branch:** `claude/dreamy-dirac-2jgkme` (pushed to origin)

**Motivation:** Architecture reviewer #2 steered toward "evidence ingestion/provenance > additional ML". This adds a mechanism for users and manufacturers to submit LCA citations for any product, with admin review before public display. Directly addresses the "evidence ingestion" gap.

**Index updated:** no
**Hot cache updated:** yes

---

## 2026-07-30 — Second Architecture Review Ingested

**Operation:** INGEST `.raw/architecture-review-2026-07-30.md` (external review #2, `main@2cb26e9`)

**Pages created:** 2
- `sources/Architecture Review 2026-07-30`
- `domains/Production Readiness`

**Pages updated:** 3
- `hot.md` — full rewrite (was stale since 2026-05-29; now covers B2B pivot, passport API, ML layer, both reviews, tier-1/2 fixes, open blockers)
- `index.md` — added source + domain pages
- `log.md` — this entry

**Key findings:**
- Score improved 5/10 → **6/10 "Pilot-ready"** (disposable-data pilots only; enterprise: no)
- All 8 tier-1/tier-2 fixes from review #1 acknowledged as resolved; CI + live health independently verified by reviewer
- Decisive blocker unchanged: ephemeral SQLite on Render free tier (no persistent disk)
- New findings: Sentry miswired (`REACT_APP_SENTRY_DSN` + uninvoked `initSentry()`), branch protection absent (PR 42 merged before CI finished), OFF worst-case ~31s latency, migration health check too shallow
- Strategic steer: evidence ingestion/provenance/versioning > additional ML

**Context (work since last log entry, 2026-05-29 → 2026-07-30):** B2B repositioning (README, `METHODOLOGY.md`, passport/portfolio/audit endpoints), course-aligned ML layer (`/api/v1/ml/*`, `ML_REPORT.md`), governance frontend, `trailingSlash` 404 fix, cold-start `ApiReadyGate`, swagger-jsdoc removal (audit chain), review #1 tier-1/2 fixes (commits `2bd6790`, `6f69df0`). Tests grew 117 → 161 backend + 6 frontend.

**Index updated:** yes
**Hot cache updated:** yes

---

## 2026-07-22 — npm Audit Fix + Tier Filter + Carbon Dashboard Widget

**Operation:** Scheduled session. Fixed blocking npm audit vulnerabilities, added grade-tier filter to products API and UI, added personal carbon summary widget to dashboard.

**Root cause (audit):** `brace-expansion <1.1.16` (high — DoS) and `js-yaml 4.0.0–4.2.0` (high — quadratic-complexity DoS) in backend production dependencies. These were blocking CI on PR #34. Fixed via `npm audit fix` updating `package-lock.json`.

**Files changed:** 4
- `backend/package-lock.json` — audit fix (brace-expansion, js-yaml, body-parser, qs)
- `backend/src/routes/products.js` — added `?tier=green|amber|red` filter param
- `backend/__tests__/api.test.js` — 4 new Supertest tests for tier filter (total 141 passing)
- `frontend/src/app/products/page.js` — grade tier pill buttons (All / Green / Amber / Red)
- `frontend/src/app/dashboard/page.js` — personal carbon summary widget (enabled: isAuthenticated)

**Branch:** `claude/dreamy-dirac-6st5cb`

**PR #37:** https://github.com/J-Dheeraj/Consciobite-Application/pull/37

**Context for PR #34:** `npm audit --production --audit-level=high` now returns 0 vulnerabilities on main once PR #37 merges; PR #34 can rebase to unblock its CI.
**Hot cache updated:** yes

---

## 2026-07-26 — User Profile + Customizable Weekly Carbon Goal

**Operation:** Implemented user profile page with personalizable weekly carbon goal.

**Files changed:** 9 (+ 1 Prettier fix)
- `backend/src/db/migrations/003_user_profile.sql` — new; adds `weekly_carbon_goal REAL DEFAULT 10.0` to `users` table
- `backend/src/routes/auth.js` — added `PATCH /api/auth/me` (CSRF-protected, validate(), requireAuth); updated `GET /api/auth/me` to return `weeklyGoal` + `createdAt`
- `backend/src/index.js` — added `skip: () => process.env.NODE_ENV === 'test'` to authLimiter (prevents rate-limit lockout during test suite)
- `backend/__tests__/auth.test.js` — 10 new tests for GET /me weeklyGoal + PATCH /me; also Prettier formatting fix pushed as follow-up
- `frontend/src/services/auth.js` — added `updateProfile({ name, weeklyGoal })`
- `frontend/src/services/api.js` — re-exports `updateProfile`
- `frontend/src/app/profile/page.js` — new page: name editor + weekly goal slider (1–50 kg); redirects unauthenticated users to /login; updates AuthContext on save
- `frontend/src/components/Navbar.js` — user's first name is now `<Link href="/profile">` in desktop + mobile menus
- `frontend/src/app/carbon/page.js` — uses `user?.weeklyGoal ?? WEEKLY_CARBON_GOAL_KG` instead of hardcoded constant

**Branch:** `claude/nifty-goodall-1w4m1h`
**PR:** #38 — CI queued after Prettier fix push

**Test status:** 147 backend tests passing. Frontend builds 567 static pages.

**CI note:** Initial CI run failed on Prettier check for `__tests__/auth.test.js` (file not formatted before first push). Fixed and re-pushed in follow-up commit.
**Hot cache updated:** yes

---

## 2026-07-28 — Carbon Log CSV Export (PR #39)

**Operation:** Scheduled session — reviewed open PRs (#34, #36, #37, #38 all CI green), identified carbon tracker as missing export capability, implemented CSV download feature.

**Files changed:** 5
- `backend/src/routes/carbon.js` — added `GET /api/carbon/export` route (auth-required, returns RFC 4180 CSV)
- `backend/__tests__/carbon.test.js` — 4 new Supertest tests (401, CSV content-type, header row, data row); total 141 tests on branch
- `frontend/src/services/carbon.js` — added `downloadCarbonExport()` using raw fetch for blob response
- `frontend/src/services/api.js` — re-exported `downloadCarbonExport`
- `frontend/src/app/carbon/page.js` — added "Export CSV" button next to "Recent Logs" heading; hidden when no logs; loading state

**Branch:** `claude/nifty-goodall-juod2y`
**PR:** #39 — opened, CI green ✓ (all 3 checks: Backend Tests, Frontend Build & Test, Docker Build Check)

**Verification:**
- All 141 backend tests passing
- ESLint and Prettier clean (backend + frontend)
- CI green on first push's Backend Tests failed (npm audit high vulns: brace-expansion via swagger-jsdoc, js-yaml); fixed with `npm audit fix` — second push CI all green

**Index updated:** no
**Hot cache updated:** yes

---

## 2026-07-17 — Docker Build Fix + CONTRIBUTING.md

**Operation:** Diagnosed and fixed CI failure on PR #34 (Digital Product Passport frontend). Authored `CONTRIBUTING.md`.

**Root cause:** `better-sqlite3` is a native addon. On `node:20-alpine` (musl libc) there are no prebuilt binaries, so npm falls back to compiling from source via node-gyp — which requires Python, make, and g++. The backend Dockerfile had none of these.

**Files changed:** 2
- `backend/Dockerfile` — added `RUN apk add --no-cache python3 make g++` before `npm ci --production`
- `CONTRIBUTING.md` — new file (was listed as a planned improvement in CLAUDE.md)

**Branch:** `claude/nifty-goodall-s4f427` — merged to main as PR #35.
**Hot cache updated:** yes

---

## 2026-07-21 — Recommendations Endpoint + Similar Products UI

**Operation:** Add missing `GET /api/products/:id/recommendations` backend endpoint, wire it into the product detail page, and write 7 integration tests. Also merged PR #35 (Dockerfile fix) and rebased PR #34 (Passport frontend) to unblock its CI.

**Files changed:** 3
- `backend/src/routes/products.js` — added `GET /:id/recommendations` route (placed before `/:id` to avoid shadowing); returns up to 6 same-category products sorted by score desc, excludes self; 400/404 on invalid or missing product
- `frontend/src/app/product/[id]/ProductDetailClient.js` — added `useQuery(["recommendations", id])` call; added Similar Products card section above Back button
- `backend/__tests__/api.test.js` — 7 new Supertest tests: happy path, same-category, self-exclusion, score ordering, max-6, bad ID, missing product

**PR actions:**
- PR #35 merged to main (Dockerfile fix + CONTRIBUTING.md, all CI green)
- PR #34 rebased onto new main (wiki conflict resolved by merging both sides)
- PR #36 opened for this session's work: `claude/dreamy-dirac-4ua0hn` → `main`

**Verification:**
- 144 backend tests passing (137 → 144, all 7 new tests green)
- ESLint and Prettier clean (backend + frontend)
- `GET /api/products/1/recommendations` returns 200 with ≤6 same-category products

**Index updated:** no
**Hot cache updated:** yes

---

## 2026-07-16 — Digital Product Passport Frontend + Tests

**Operation:** Add frontend page and service layer for the Digital Product Passport API (added in previous session), plus integration test coverage for all three passport routes.

**Files created:** 4
- `backend/__tests__/passport.test.js` — 36 Supertest integration tests for GET /passport/:id, POST /portfolio/score, GET /audit/:id
- `frontend/src/app/passport/[id]/page.js` — static server wrapper with generateStaticParams (550 pages)
- `frontend/src/app/passport/[id]/PassportClient.js` — PassportCard UI: SVG score ring, 7-dimension emission bars, confidence badge, summary grid, methodology link
- (inferred: `frontend/src/app/passport/` directory)

**Files updated:** 3
- `frontend/src/services/products.js` — added fetchPassport, fetchPortfolioScore, fetchAuditLog
- `frontend/src/services/api.js` — re-exported new passport service functions
- `frontend/src/app/product/[id]/ProductDetailClient.js` — added "Eco Passport" button alongside "Back" button

**Verification:**
- 153 backend tests passing (117 → 153, all 36 new tests green)
- ESLint and Prettier clean (no warnings or errors)
- Branch: `claude/dreamy-dirac-fzmsdt` pushed to remote

**Index updated:** yes
**Hot cache updated:** yes

---

## 2026-05-29 — Governance Charter Ingested

**Operation:** Ingest GreenGrade Independent Advisory Panel Terms of Reference v1.0 into wiki vault and repo.

**Files created:** 2
- `GreenGrade_Governance_Charter.md` (repo root) — full charter for founding member review
- `wiki/sources/GreenGrade Governance Charter 2026-05-29` — wiki source page with summary and technical connections

**Files updated:** 3
- `wiki/domains/Grading Independence Governance` — Phase 1 updated from proposal to drafted charter with full details
- `wiki/index.md` — added charter source page
- `wiki/hot.md` — updated with charter status

**Key points:**
- Charter defines 3-seat Panel: academic, regulatory/civil society, non-client industry
- Four powers: methodology audit, score challenge (14-day SLA), conflict flag (30-day response), annual public report
- Conflict-of-interest firewall: no paid relationships, no client financial interests, 12-month cooling-off
- Voluntary service (no fees to avoid dependency)
- 2-year terms, staggered, renewable once
- Precedents cited: Nutri-Score, Rainforest Alliance, Carbon Trust, Which?
- Pitch scripts included for regulators, retailers, and media

**Index updated:** yes
**Hot cache updated:** yes

---

## 2026-05-21 — Session 1: Governance Database Layer

**Operation:** Implement conflict-of-interest audit trail (Session 1 of governance brief), adapted from Prisma/Supabase to existing SQLite/Express stack. Also created stack migration plan for future transition.

**Files created:** 4
- `backend/src/db/migrations/002_governance_layer.sql` — manufacturers, product_manufacturers, score_change_logs, product_scores tables + users.role column
- `backend/src/services/scoreAudit.js` — logScoreChange(), snapshotScores(), getConflictLog(), getConflictStats()
- `backend/src/routes/admin.js` — admin-only API routes (conflict-log, rescore, manufacturers, product-manufacturer linking, fee acknowledgement)
- `wiki/concepts/Stack Migration Plan.md` — 4-phase plan: Prisma → Tailwind/shadcn → Supabase DB → Supabase Auth

**Files modified:** 2
- `backend/src/middleware/auth.js` — added requireAdmin middleware (checks users.role = 'admin')
- `backend/src/index.js` — mounted admin routes, added score snapshot on startup

**Verification:**
- Migration creates all tables correctly (verified via PRAGMA)
- 550 product scores snapshotted on first startup
- 0 score changes on first run (correct — no previous baseline)
- 117 backend tests still passing
- Prettier and ESLint clean

**Index updated:** yes

---

## 2026-05-21 — Investor Feedback: Grading Independence

**Operation:** Document investor feedback on conflict of interest in business model (manufacturer-pays-for-grading vs. independent scoring claims).

**Pages created:** 2
- `sources/Investor Feedback 2026-05-21`
- `domains/Grading Independence Governance`

**Key points:**
1. **Conflict identified:** Revenue model (manufacturers pay for listing/grading) conflicts with independence claims of GreenGrade scoring
2. **Proposed fix:** Independent Grading Advisory Board (3 members: academic, civil servant e.g. SFA, non-client industry rep)
3. **Board mandate:** Annual methodology audit, sign-off on scoring parameter changes, published audit summary, conflict-of-interest register
4. **Technical follow-ups:** Expand `/methodology` page, add scoring changelog, board disclosure page, audit trail for `greengrade.js` parameter changes
5. **Strategic value:** Transforms defensive weakness into proactive governance narrative; pre-empts EU Green Claims Directive and Singapore regulatory scrutiny

**Action required:** Business/governance initiative — no immediate code changes. Phase 2 technical work tracked in the governance domain page.

**Index updated:** yes
**Hot cache updated:** yes

---

## 2026-05-13 — CI/Deployment Fix Session

**Operation:** Fix CI failures, Render deployment, Docker build, and merge conflicts on `claude/improve-application-S5njo` branch.

**Pages created:** 3
- `concepts/Static Export Pipeline`
- `concepts/Render Deployment`
- `concepts/Docker Build Context`

**Pages updated:** 4
- `hot.md` — refreshed with current stack, deployment, and fix summary
- `meta/Consciobite Architecture Overview` — updated stack table and directory structure for Next.js
- `architecture/System Overview` — updated for static export and API base detection
- `index.md` — added new concept pages

**Key changes:**
1. **Merge conflicts** — 7 files resolved between feature branch and main
2. **Next.js static export** — `output: 'export'` in next.config.js, build renames `out/` to `build/`
3. **generateStaticParams()** — Dynamic `/product/[id]` split into server wrapper + `ProductDetailClient.js`; reads 550 product IDs from `backend/src/data/products.json` at build time
4. **Docker build context** — Changed from `./frontend` to `.` (repo root) so products.json is accessible during Docker build
5. **Dockerfile** — All COPY paths updated for repo-root context; products.json copied to `/backend/src/data/products.json`
6. **docker-compose.yml** — Fixed build context and env var name (`REACT_APP_API_URL` -> `NEXT_PUBLIC_API_URL`)
7. **ESLint** — Migrated from `react-app` to `next/core-web-vitals`; added `eslint` + `eslint-config-next` to devDependencies
8. **Validation schemas** — Removed `max: 100` from carbon quantity, raised reviews `productId` maxLength, removed UUID patterns from delete schemas
9. **Prettier** — Reformatted 13 files across backend and frontend
10. **JSX entities** — Fixed unescaped quotes in carbon/favorites/login pages

**Commits (chronological):**
- `d31b1b9` — fix: update frontend Dockerfile for Next.js
- `06f889b` — fix: add eslint + eslint-config-next and fix lint errors
- `588a571` — fix: reformat carbon/page.js after entity escaping
- `b3390fd` — fix: update Render deployment for Next.js
- `22d0405` — fix: switch to Next.js static export to match Render static site config
- `5635240` — fix: use repo-root Docker build context so products.json is accessible

**Index updated:** yes
**Hot cache updated:** yes

---

## 2026-04-25 — Migration Brief Review

**Operation:** REVIEW `GREENGRADE_MIGRATION_BRIEF.md` (wiki-query deep mode)
**Pages created:** 2
- `questions/Is the GreenGrade Migration Brief Accurate`
- `sources/GreenGrade Migration Brief 2026-04-25`

**Key findings:** 5 factual errors in the brief (JS not Python, no Tailwind, 550 not 576 products, no water footprint data, products in JSON not SQLite). Session 2 scope severely underestimated — full language rewrite required.

**Index updated:** yes

---

## 2026-04-25 — Initial Ingest

**Operation:** INGEST `.raw/graphify-audit-2026-04-25.md`
**Pages created:** 12
- `sources/Graphify Audit 2026-04-25`
- `entities/CarbonTracker Component`
- `entities/GreenGrade Service`
- `entities/Open Food Facts Integration`
- `entities/RequireAuth Guard`
- `entities/validate() Middleware`
- `concepts/Auth-Expired Event Bus`
- `concepts/GreenGrade KDE Scoring`
- `concepts/Product Catalog Schema`
- `concepts/Validate Middleware Pattern`
- `domains/Backend Security`
- `domains/Frontend Accessibility`
- `domains/Frontend Error Handling`
- `questions/What Did the Graphify Audit Find`
- `meta/Consciobite Architecture Overview`

**Index updated:** yes
**Hot cache updated:** yes
