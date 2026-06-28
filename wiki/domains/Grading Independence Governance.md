---
type: domain
title: "Grading Independence & Governance"
created: 2026-05-21
status: developing
tags: [governance, grading, independence, business-model, investor-feedback]
updated: 2026-06-28
---

# Grading Independence & Governance

Cross-cutting concern: ensuring GreenGrade scoring is (and is perceived as) independent of commercial relationships.

---

## The Problem

Consciobite charges manufacturers for listing and grading. GreenGrade scores claim to be objective. These two facts create a conflict of interest that investors, regulators, and retail partners will flag.

## Current State (updated 2026-06-28)

- GreenGrade algorithm is deterministic (KDE + sigmoid, 7 emission dimensions) — see [[GreenGrade KDE Scoring]]
- Methodology page at `/methodology` now renders live from `GET /api/methodology`; full spec also published at `METHODOLOGY.md` (repo root, v3.0)
- **Audit trail implemented** — [[Score Audit Service]] logs every per-product score change with paying-client flag
- **Admin conflict log** — [[Admin Routes]] at `/api/admin/conflict-log` with paying/non-paying filter and aggregate stats, now with an admin UI at `frontend/src/app/admin/conflict-log/page.js`
- **Manufacturer tracking** — `manufacturers` + `product_manufacturers` tables in SQLite, with onboarding UI at `frontend/src/app/admin/manufacturers/page.js`
- **Score snapshots** — 550 product scores captured on every server startup; drift auto-detected
- **Governance charter drafted** — [[GreenGrade Governance Charter 2026-05-29]] defines Panel composition, mandate, firewall, access rights, and cadence. Ready for founding member review.
- **Landing page updated** — "Independent Scoring" copy replaces "No Pay-to-Win"; product count corrected to 550
- **Public transparency page shipped** (PR #31/#32) — `frontend/src/app/transparency/page.js`, backed by `GET /api/transparency/stats`. Shows panel seats (currently "In formation" — unconfirmed), 5 public commitments, methodology version badge, live score-change stats.
- **Digital Product Passport API shipped** (PR #33) — `backend/src/routes/passport.js`, B2B endpoints for EU ESPR / SGX Scope 3 reporting (`/v1/passport/:productId`, `/v1/portfolio/score`, `/v1/audit/:productId`). Increases the audience that depends on `methodology_version` being trustworthy, not just cosmetic.
- **Methodology changelog shipped (2026-06-28)** — versioned audit trail for algorithm *parameter* changes, distinct from [[Score Audit Service]] (which audits per-product score deltas, not the algorithm itself). New `methodology_versions` SQLite table (migration `003_methodology_changelog.sql`, backfilled with the v3.0 baseline), `backend/src/services/methodologyChangelog.js` (`getCurrentVersion`, `getChangelog`, `recordVersion`), public `GET /api/methodology/changelog`, and admin-only `POST /api/admin/methodology-version` to record a new version + summary + changed params. `methodology_version` in `GET /api/methodology` and the Digital Product Passport API now reads from this table instead of being a hardcoded `"3.0"` string in two different files.
- Advisory board not yet formed (candidates to be identified) — still blocked on human input, not code.
- Board disclosure page (names/affiliations) still blocked on the same — cannot be built until founding members are identified.

## Action Plan

### Phase 1 — Advisory Panel Charter (done)

Charter drafted at `/GreenGrade_Governance_Charter.md`. See [[GreenGrade Governance Charter 2026-05-29]] for full details.

**Panel seats (3):**

| Seat | Profile | Independence Guarantee |
|------|---------|----------------------|
| Academic | Food systems / LCA researcher | No consulting for Consciobite or clients |
| Regulatory | FSAI / EPA / CCPC (or consumer advocacy) | Peer credibility with regulators |
| Industry | Non-client retail/food professional | NOT a paying Consciobite client |

**Four powers:** methodology audit (annual), score challenge (14-day SLA), conflict-of-interest flag (30-day public response), annual public report (500-800 words).

**Firewall:** No paid/unpaid advisory relationships, no financial interest in clients, 12-month cooling-off. Voluntary service (no fees).

**Activation steps remaining:**
1. Identify 3 founding candidates (target: 2 weeks)
2. Share charter for comments (1 week)
3. Publish on website at `/transparency` (Session 3 code work)
4. First Panel meeting within 90 days of acceptance

### Phase 2 — Transparency Features (code changes)

1. **Public methodology page enhancement** — done (PR #33). `/methodology` renders live from `GET /api/methodology`; full spec at `METHODOLOGY.md`. Advisory board member names still missing (blocked on Phase 1 candidate identification, not code).
2. **Scoring changelog** — done (2026-06-28). See "Methodology changelog shipped" above.
3. **Board disclosure page** — still blocked. Needs real founding-member names/affiliations before it can be built; do not stub with placeholder names.
4. **Audit trail for parameter changes** — done (2026-06-28), same work as item 2. `greengrade.js` parameters are still hardcoded constants (by design — they're the algorithm), but changes to them are now expected to be paired with a `POST /api/admin/methodology-version` call so the changelog stays accurate. This pairing is **not yet enforced in code** — it relies on the engineer remembering. A future improvement could diff `greengrade.js` constants against the last recorded version on startup and warn if they drift.

### Phase 3 — Certification (long-term)

- Pursue third-party certification (e.g. B Corp, ISO 14001 alignment)
- Align with EU Green Claims Directive requirements
- Consider open-sourcing the scoring methodology

## Technical Touchpoints

| File | Relevance | Status |
|------|-----------|--------|
| `backend/src/services/scoreAudit.js` | Score change audit trail | Done (Session 1) |
| `backend/src/routes/admin.js` | Admin conflict log + manufacturer CRUD | Done (Session 1) |
| `backend/src/db/migrations/002_governance_layer.sql` | Governance tables | Done (Session 1) |
| `backend/src/middleware/auth.js` | `requireAdmin` middleware | Done (Session 1) |
| `backend/src/services/greengrade.js` | Core scoring algorithm | Existing — wired to audit |
| `frontend/src/app/methodology/page.js` | Public methodology page | Done (PR #33) |
| `frontend/src/app/transparency/page.js` | Public governance & stats page | Done (PR #31/#32) |
| `backend/src/routes/passport.js` | Digital Product Passport B2B API | Done (PR #33) |
| `backend/src/services/methodologyChangelog.js` | Algorithm version/parameter changelog | Done (2026-06-28) |
| `backend/src/db/migrations/003_methodology_changelog.sql` | `methodology_versions` table | Done (2026-06-28) |
| `backend/src/data/products.json` | Product catalog with emission data | Existing |

## Links

- [[Investor Feedback 2026-05-21]] — original feedback that prompted this
- [[GreenGrade Governance Charter 2026-05-29]] — Panel charter (draft v1.0)
- [[Score Audit Service]] — audit trail implementation
- [[Admin Routes]] — admin API endpoints
- [[Stack Migration Plan]] — future Prisma/Supabase migration
- [[GreenGrade KDE Scoring]] — algorithm details
- [[GreenGrade Service]] — implementation
- [[Data Provenance]] — where emission data comes from
