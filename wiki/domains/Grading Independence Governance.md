---
type: domain
title: "Grading Independence & Governance"
created: 2026-05-21
status: developing
tags: [governance, grading, independence, business-model, investor-feedback]
---

# Grading Independence & Governance

Cross-cutting concern: ensuring GreenGrade scoring is (and is perceived as) independent of commercial relationships.

---

## The Problem

Consciobite charges manufacturers for listing and grading. GreenGrade scores claim to be objective. These two facts create a conflict of interest that investors, regulators, and retail partners will flag.

## Current State (updated 2026-06-16)

- GreenGrade algorithm is deterministic (KDE + sigmoid, 7 emission dimensions) — see [[GreenGrade KDE Scoring]]
- Methodology page exists at `/methodology`; full technical spec also published as `METHODOLOGY.md` (repo root, GreenGrade v3.0)
- **Audit trail implemented** — [[Score Audit Service]] logs every score change with paying-client flag
- **Admin conflict log** — [[Admin Routes]] at `/api/admin/conflict-log` with paying/non-paying filter and aggregate stats, plus an admin UI at `/admin/conflict-log` (summary stats, filters, rescore button, full audit table)
- **Manufacturer tracking** — `manufacturers` + `product_manufacturers` tables in SQLite, with an admin onboarding UI at `/admin/manufacturers` (create form with fee-acknowledgement checkbox, product linking, registered manufacturers table)
- **Score snapshots** — 550 product scores captured on every server startup; drift auto-detected
- **Governance charter drafted** — [[GreenGrade Governance Charter 2026-05-29]] defines Panel composition, mandate, firewall, access rights, and cadence. Ready for founding member review.
- **Public transparency page shipped** — `/transparency` (frontend) renders governance config, advisory panel seats, commitments, methodology link, and live score-change stats from `GET /api/transparency/stats` (cached 300s)
- **Landing page updated** — "Independent Scoring" copy replaces "No Pay-to-Win"; product count corrected to 550
- **B2B Digital Product Passport API** — see [[Digital Product Passport API]]. Exposes per-product GreenGrade breakdowns and audit history for EU ESPR / SGX Scope 3 reporting, reusing the same audit trail this governance work built.
- Advisory board not yet formed (candidates to be identified)

## Phase 2 — Transparency Features: status (was "pending", now shipped)

All four Phase 2 items from the original plan are now live:
1. Public methodology page — `/methodology` plus standalone `METHODOLOGY.md`
2. Scoring changelog — `score_change_logs` table, exposed via `/api/admin/conflict-log` and the per-product `/v1/audit/:productId` passport endpoint
3. Board disclosure / governance page — `/transparency`
4. Audit trail — [[Score Audit Service]], wired into `greengrade.js` score changes

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

### Phase 2 — Transparency Features (done, see status note above)

1. **Public methodology page enhancement** — expand `/methodology` with full algorithm documentation, data sources, and advisory board members
2. **Scoring changelog** — version-controlled log of any changes to GreenGrade parameters (weights, thresholds, category definitions)
3. **Board disclosure page** — names, affiliations, conflict-of-interest declarations
4. **Audit trail** — backend logging for when/why scoring parameters change (currently hardcoded in `backend/src/services/greengrade.js`)

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
| `frontend/src/app/methodology/page.js` | Public methodology page | Done |
| `frontend/src/app/transparency/page.js` | Public governance & stats page | Done (Session 3) |
| `frontend/src/app/admin/conflict-log/page.js` | Admin audit UI | Done (Session 2) |
| `frontend/src/app/admin/manufacturers/page.js` | Manufacturer onboarding UI | Done (Session 4) |
| `backend/src/routes/passport.js` | B2B Digital Product Passport API | Done |
| `METHODOLOGY.md` | Standalone technical spec (GreenGrade v3.0) | Done |
| `backend/src/data/products.json` | Product catalog with emission data | Existing |

## Links

- [[Investor Feedback 2026-05-21]] — original feedback that prompted this
- [[GreenGrade Governance Charter 2026-05-29]] — Panel charter (draft v1.0)
- [[Score Audit Service]] — audit trail implementation
- [[Admin Routes]] — admin API endpoints
- [[Digital Product Passport API]] — B2B reporting endpoints reusing this audit trail
- [[Stack Migration Plan]] — future Prisma/Supabase migration
- [[GreenGrade KDE Scoring]] — algorithm details
- [[GreenGrade Service]] — implementation
- [[Data Provenance]] — where emission data comes from
