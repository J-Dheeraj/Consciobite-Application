---
type: domain
title: "Grading Independence & Governance"
created: 2026-05-21
updated: 2026-06-21
status: developing
tags: [governance, grading, independence, business-model, investor-feedback]
---

# Grading Independence & Governance

Cross-cutting concern: ensuring GreenGrade scoring is (and is perceived as) independent of commercial relationships.

---

## The Problem

Consciobite charges manufacturers for listing and grading. GreenGrade scores claim to be objective. These two facts create a conflict of interest that investors, regulators, and retail partners will flag.

## Current State (updated 2026-06-21)

- GreenGrade algorithm is deterministic (KDE + sigmoid, 7 emission dimensions) — see [[GreenGrade KDE Scoring]]
- Methodology page exists at `/methodology`; full v3.0 technical spec also published at repo root as `METHODOLOGY.md`
- **Audit trail implemented** — [[Score Audit Service]] logs every score change with paying-client flag
- **Admin conflict log** — [[Admin Routes]] at `/api/admin/conflict-log` with paying/non-paying filter and aggregate stats, plus an admin UI at `/admin/conflict-log`
- **Manufacturer tracking** — `manufacturers` + `product_manufacturers` tables in SQLite, with an admin onboarding UI at `/admin/manufacturers` ([[Admin Manufacturer Onboarding]])
- **Score snapshots** — 550 product scores captured on every server startup; drift auto-detected
- **Governance charter drafted** — [[GreenGrade Governance Charter 2026-05-29]] defines Panel composition, mandate, firewall, access rights, and cadence. Ready for founding member review.
- **Public transparency page shipped** — [[Transparency Page]] at `/transparency`, pulls live score-change stats from `GET /api/transparency/stats`
- **Landing page updated** — "Independent Scoring" copy replaces "No Pay-to-Win"; product count corrected to 550
- **B2B Digital Product Passport API shipped** — [[Digital Product Passport API]] exposes per-product and portfolio GreenGrade data plus the audit trail for EU ESPR / SGX Scope 3 reporting use cases
- Advisory board not yet formed — all 3 panel seats on the transparency page still show "In Formation"; no `confirmed: true` seats yet
- No published annual review statement yet (first review scheduled 2026-12-01 per `GOVERNANCE_CONFIG.nextReviewDate` in `frontend/src/app/transparency/page.js`)

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

**Remaining (not code work — business/governance track):**
1. Identify 3 founding candidates and confirm seats (page currently shows all 3 as "In Formation")
2. Share charter for comments
3. First Panel meeting within 90 days of acceptance
4. Publish first annual review statement ahead of the 2026-12-01 target date

### Phase 2 — Transparency Features (code changes) — done

1. ~~Public methodology page enhancement~~ — done via `METHODOLOGY.md` (full v3.0 spec) plus the existing `/methodology` page
2. ~~Public governance & stats page~~ — done, [[Transparency Page]] at `/transparency`
3. ~~Audit trail~~ — done, [[Score Audit Service]] + `/api/admin/conflict-log` + the new public `/api/audit/:productId` endpoint in [[Digital Product Passport API]]
4. **Scoring changelog for algorithm parameters** — not yet done. The audit trail covers per-product *score* changes, but changes to the GreenGrade *parameters themselves* (weights, sigmoid thresholds, category definitions in `backend/src/services/greengrade.js`) are still untracked. This is the one open item from the original Phase 2 brief.
5. **Board disclosure page** — partially done. The transparency page lists panel seats and their focus areas, but there's no named-individual disclosure yet since no seats are confirmed.

### Phase 3 — Certification (long-term)

- Pursue third-party certification (e.g. B Corp, ISO 14001 alignment)
- Align with EU Green Claims Directive requirements
- Consider open-sourcing the scoring methodology
- The new Digital Product Passport API is a concrete step toward EU ESPR alignment

## Technical Touchpoints

| File | Relevance | Status |
|------|-----------|--------|
| `backend/src/services/scoreAudit.js` | Score change audit trail | Done (Session 1) |
| `backend/src/routes/admin.js` | Admin conflict log + manufacturer CRUD | Done (Session 1) |
| `backend/src/db/migrations/002_governance_layer.sql` | Governance tables | Done (Session 1) |
| `backend/src/middleware/auth.js` | `requireAdmin` middleware | Done (Session 1) |
| `backend/src/services/greengrade.js` | Core scoring algorithm | Existing — wired to audit; parameter-change tracking still open |
| `frontend/src/app/methodology/page.js` + `METHODOLOGY.md` | Public methodology documentation | Done |
| `frontend/src/app/transparency/page.js` | Public governance & stats page | Done (Session 3) |
| `frontend/src/app/admin/conflict-log/page.js` | Admin audit UI | Done (Session 2) |
| `frontend/src/app/admin/manufacturers/page.js` | Manufacturer onboarding UI | Done (Session 4) |
| `backend/src/routes/passport.js` | B2B Digital Product Passport / portfolio / audit API | Done |
| `backend/src/data/products.json` | Product catalog with emission data | Existing |

## Links

- [[Investor Feedback 2026-05-21]] — original feedback that prompted this
- [[GreenGrade Governance Charter 2026-05-29]] — Panel charter (draft v1.0)
- [[Score Audit Service]] — audit trail implementation
- [[Admin Routes]] — admin API endpoints
- [[Transparency Page]] — public governance page
- [[Admin Manufacturer Onboarding]] — admin onboarding UI
- [[Digital Product Passport API]] — B2B reporting API
- [[Stack Migration Plan]] — future Prisma/Supabase migration
- [[GreenGrade KDE Scoring]] — algorithm details
- [[GreenGrade Service]] — implementation
- [[Data Provenance]] — where emission data comes from
