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

## Current State (updated 2026-06-24)

- GreenGrade algorithm is deterministic (KDE + sigmoid, 7 emission dimensions) — see [[GreenGrade KDE Scoring]]
- Methodology page exists at `/methodology` in the frontend; `METHODOLOGY.md` (repo root, added `8d7ead3`) carries the full GreenGrade v3.0 technical spec for external/B2B readers
- **Audit trail implemented** — [[Score Audit Service]] logs every score change with paying-client flag
- **Admin conflict log** — [[Admin Routes]] at `/api/admin/conflict-log` with paying/non-paying filter and aggregate stats, surfaced in a real admin page — [[Governance Frontend]]
- **Manufacturer tracking** — `manufacturers` + `product_manufacturers` tables in SQLite, managed via the admin manufacturers page — [[Governance Frontend]]
- **Score snapshots** — 550 product scores captured on every server startup; drift auto-detected
- **Governance charter drafted** — [[GreenGrade Governance Charter 2026-05-29]] defines Panel composition, mandate, firewall, access rights, and cadence. Ready for founding member review.
- **Landing page updated** — "Independent Scoring" copy replaces "No Pay-to-Win"; product count corrected to 550
- **Public transparency page live** at `/transparency` since `b6063fd` (2026-05-29) — panel seats, commitments, methodology link, live score-change stats from `GET /api/transparency/stats`. This was built before the previous wiki update but never logged — see [[Governance Frontend]].
- **B2B passport API** — `/v1/passport/:productId`, `/v1/portfolio/score`, `/v1/audit/:productId` (added `8d7ead3`) expose per-product GreenGrade data with `methodology_version` for EU ESPR / SGX Scope 3 reporting — see [[Digital Product Passport API]]
- Advisory board not yet formed (candidates to be identified) — panel seats on `/transparency` still render "In formation"

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
3. ~~Publish on website at `/transparency`~~ — done, live since `b6063fd`
4. First Panel meeting within 90 days of acceptance

### Phase 2 — Transparency Features (code changes)

1. **Public methodology page enhancement** — done: `/methodology` already covers algorithm, data sources, and limitations; `METHODOLOGY.md` adds the full external-facing spec. Advisory board members still pending (blocked on Phase 1 step 1).
2. **Scoring changelog** — not done. Distinct from the score-audit trail: this would version-control changes to GreenGrade *parameters themselves* (weights, thresholds, category definitions in `backend/src/services/greengrade.js`), not per-product score drift.
3. **Board disclosure page** — not done, blocked on Phase 1 step 1 (no real candidates to disclose yet)
4. **Audit trail** — done (Session 1)

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
| `frontend/src/app/transparency/page.js` | Public governance & stats page | Done (`b6063fd`) |
| `backend/src/routes/passport.js` | B2B passport/audit API (`/v1/*`) | Done (`8d7ead3`) |
| `METHODOLOGY.md` | External technical spec, GreenGrade v3.0 | Done (`8d7ead3`) |
| `backend/src/data/products.json` | Product catalog with emission data | Existing |

## Links

- [[Investor Feedback 2026-05-21]] — original feedback that prompted this
- [[GreenGrade Governance Charter 2026-05-29]] — Panel charter (draft v1.0)
- [[Score Audit Service]] — audit trail implementation
- [[Admin Routes]] — admin API endpoints
- [[Governance Frontend]] — admin + public governance pages
- [[Digital Product Passport API]] — B2B GreenGrade data API
- [[Stack Migration Plan]] — future Prisma/Supabase migration
- [[GreenGrade KDE Scoring]] — algorithm details
- [[GreenGrade Service]] — implementation
- [[Data Provenance]] — where emission data comes from
