---
type: meta
title: "Operation Log"
created: 2026-04-25
updated: 2026-06-28
status: evergreen
tags: [log, meta]
---

# Operation Log

Append-only. Newest entries at top.

---

## 2026-06-28 — Wiki/Code Sync + Methodology Changelog

**Operation:** Scheduled routine session. Vault was stale relative to `main` (PR #31/#32 governance frontend, PR #33 Digital Product Passport API + methodology docs + cold-start UX had landed without wiki updates). Backfilled documentation, then closed a real governance gap found during the sync: GreenGrade's `methodology_version` was a hardcoded `"3.0"` string duplicated in two files with no audit trail for algorithm/parameter changes — Phase 2 item 2 ("scoring changelog") of [[Grading Independence Governance]].

**Files created:** 4
- `backend/src/db/migrations/003_methodology_changelog.sql` — `methodology_versions` table, backfilled with v3.0 baseline
- `backend/src/services/methodologyChangelog.js` — `getCurrentVersion()`, `getChangelog()`, `recordVersion()`
- `backend/__tests__/methodologyChangelog.test.js` — 9 tests (public changelog read, admin-only version recording, duplicate/validation rejection, passport + methodology endpoints reflect the latest version)
- `wiki/entities/Methodology Changelog Service.md`

**Files modified:** 6
- `backend/src/routes/admin.js` — `POST /api/admin/methodology-version` (admin only)
- `backend/src/index.js` — `GET /api/methodology/changelog` (public, paginated)
- `backend/src/services/dataProvenance.js` — `getMethodology().version` now reads from the changelog table instead of a hardcoded string
- `backend/src/routes/passport.js` — `methodology_version` in passport responses now reads from the changelog table
- `wiki/domains/Grading Independence Governance.md` — Phase 2 status updated (items 2 and 4 done, item 1 done, item 3 still blocked on real board candidate names), Technical Touchpoints table updated, Current State backfilled with PR #31/#32/#33 details
- `wiki/hot.md` — backfilled with governance frontend, Digital Product Passport API, and methodology changelog summaries

**Verification:**
- 147 backend tests passing across 7 suites (CLAUDE.md's "117 tests" figure is stale — PR #32 alone added 20 admin governance tests; +9 more from this session)
- ESLint clean (only pre-existing unrelated warnings)
- Prettier clean
- Manually traced `methodology_version` through `/api/methodology`, `/api/v1/passport/:id`, and `/api/v1/portfolio/score` to confirm all three now derive from the same source of truth

**Known gap left open:** Nothing in code enforces that a future `greengrade.js` parameter change is paired with a `POST /api/admin/methodology-version` call — documented in [[Methodology Changelog Service]] rather than built out, since there's no concrete need yet for automated drift detection.

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
