---
type: meta
title: "Operation Log"
created: 2026-04-25
updated: 2026-05-21
status: evergreen
tags: [log, meta]
---

# Operation Log

Append-only. Newest entries at top.

---

## 2026-06-23 — Scoring Changelog (Phase 2 governance)

**Operation:** Scheduled session. Caught wiki up on two unrecorded merged PRs (#30 governance frontend, #33 Digital Product Passport), then closed Phase 2 item 2 of the governance plan: a version-controlled GreenGrade scoring changelog.

**Files modified:** 4
- `backend/src/services/dataProvenance.js` — added `METHODOLOGY_CHANGELOG` (5 entries, v1.0–v3.1) to `getMethodology()`, dated from real `git log` history on `greengrade.js`/`scoreAudit.js`
- `backend/src/swagger.js` — documented the new `changelog` field on `/methodology`
- `frontend/src/app/methodology/page.js` — new "Scoring Changelog" section
- `backend/__tests__/api.test.js` — added `GET /api/methodology` test

**Verification:**
- 138/138 backend tests pass (was 117; +20 from PR #30 admin tests, +1 new)
- ESLint and Prettier clean (backend + frontend)
- Frontend build succeeds: 569 static pages
- Pushed to `claude/nifty-goodall-lh9jvu`

**Note:** the local git "origin" is a proxy that lags the real GitHub repo — confirmed via GitHub MCP `list_pull_requests` that PRs #30–#33 are actually merged to `main` even though the proxy's `origin/main` ref still pointed at the PR #31 commit. Use the GitHub MCP tools, not local `git log origin/main`, to check merge state.

**Index updated:** no (no new pages, only domain page + hot cache + log)
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
