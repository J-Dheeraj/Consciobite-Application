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

## Current State (updated 2026-06-23)

- GreenGrade algorithm is deterministic (KDE + sigmoid, 7 emission dimensions) — see [[GreenGrade KDE Scoring]]
- Methodology page exists at `/methodology` in the frontend
- **Audit trail implemented** — [[Score Audit Service]] logs every score change with paying-client flag
- **Admin conflict log** — [[Admin Routes]] at `/api/admin/conflict-log` with paying/non-paying filter and aggregate stats
- **Manufacturer tracking** — `manufacturers` + `product_manufacturers` tables in SQLite
- **Score snapshots** — 550 product scores captured on every server startup; drift auto-detected
- **Governance charter drafted** — [[GreenGrade Governance Charter 2026-05-29]] defines Panel composition, mandate, firewall, access rights, and cadence. Ready for founding member review.
- **Landing page updated** — "Independent Scoring" copy replaces "No Pay-to-Win"; product count corrected to 550
- **Transparency page shipped** (PR #30) — `/transparency` shows panel seats (currently "In formation"), commitments, methodology summary, live score-change statistics from the audit trail, and a contact address
- **Scoring changelog shipped (2026-06-23)** — `getMethodology()` in `backend/src/services/dataProvenance.js` now returns a `changelog` array (5 entries, v1.0 → v3.1) built from real commit history; rendered on `/methodology`. Closes Phase 2 item 2.
- Advisory board not yet formed (candidates to be identified)
- Board disclosure page exists structurally (seat cards on `/transparency`) but has no confirmed members yet — names/affiliations still pending candidate identification

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

1. **Public methodology page enhancement** — done. `/methodology` covers algorithm documentation, data sources, confidence scoring, limitations, references, and the changelog. Advisory board *members* still pending (seat cards live on `/transparency` instead).
2. **Scoring changelog** — done (2026-06-23). `backend/src/services/dataProvenance.js` exports a static `METHODOLOGY_CHANGELOG` array via `getMethodology().changelog`; rendered on `/methodology`. Entries are derived from real `greengrade.js`/`scoreAudit.js` commit history, not invented. This documents *algorithm* version history — it is distinct from [[Score Audit Service]], which logs *per-product* score drift.
3. **Board disclosure page** — partially done. `/transparency` has seat cards (academic/regulatory/industry) but all show "In formation" — no real names/affiliations until Phase 1 step 1 (identify founding candidates) completes.
4. **Audit trail** — done (Session 1). See [[Score Audit Service]].

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
| `backend/src/services/dataProvenance.js` | `getMethodology()` + `METHODOLOGY_CHANGELOG` | Done (2026-06-23) |
| `frontend/src/app/methodology/page.js` | Public methodology page — algorithm docs + changelog | Done |
| `frontend/src/app/transparency/page.js` | Public governance & stats page | Done (PR #30) |
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
