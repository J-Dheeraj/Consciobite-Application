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

## Current State (updated 2026-06-18)

- GreenGrade algorithm is deterministic (KDE + sigmoid, 7 emission dimensions) — see [[GreenGrade KDE Scoring]]
- Methodology page exists at `/methodology`; full technical spec now also published at `METHODOLOGY.md` (repo root, GreenGrade v3.0, PR #33)
- **Audit trail implemented** — [[Score Audit Service]] logs every score change with paying-client flag
- **Admin conflict log** — [[Admin Routes]] at `/api/admin/conflict-log` with paying/non-paying filter and aggregate stats
- **Manufacturer tracking** — `manufacturers` + `product_manufacturers` tables in SQLite
- **Score snapshots** — 550 product scores captured on every server startup; drift auto-detected
- **Governance charter drafted** — [[GreenGrade Governance Charter 2026-05-29]] defines Panel composition, mandate, firewall, access rights, and cadence. Ready for founding member review.
- **Landing page updated** — "Independent Scoring" copy replaces "No Pay-to-Win"; product count corrected to 550
- **Transparency dashboard shipped** — `/transparency` (public, no auth) renders panel seats (currently all "in formation"/unconfirmed), the firewall commitments list, and aggregate score-change stats via `fetchTransparencyStats()` (PR #30, 2026-05-29)
- **Admin governance UI shipped** — `/admin/conflict-log` and `/admin/manufacturers` (manufacturer onboarding, fee acknowledgement, product linking) (PR #30, 2026-05-29)
- **B2B audit API** — [[Digital Product Passport API]] exposes `GET /api/v1/audit/:productId`, a public read of the same `score_change_logs` table the admin conflict log uses, framed for ESG/compliance buyers rather than internal admins (PR #33, 2026-06-08)
- Advisory board not yet formed — all 3 panel seats on `/transparency` still show `confirmed: false` (candidates to be identified)

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

### Phase 2 — Transparency Features (done, PR #30 + #33)

1. ~~Public methodology page enhancement~~ — `METHODOLOGY.md` now carries the full v3.0 spec (KDE bandwidth selection, CDF blending, sigmoid transform, Mahalanobis anomaly detection); `/methodology` remains the in-app summary
2. ~~Scoring changelog~~ — covered by [[Score Audit Service]] + the public `/api/v1/audit/:productId` endpoint, not a separate static changelog
3. **Board disclosure page** — `/transparency` lists the 3 panel seats by role/focus, but all show `confirmed: false` — names/affiliations still pending real appointments
4. ~~Audit trail~~ — done since Session 1 (`scoreAudit.js`), now also exposed publicly via [[Digital Product Passport API]]

**Remaining gap:** the panel seats themselves are still unfilled — this is a people/process task, not a code task.

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
| `frontend/src/app/methodology/page.js` | Public methodology page | Existing |
| `frontend/src/app/transparency/page.js` | Public governance & stats page | Done (PR #30) |
| `frontend/src/app/admin/conflict-log/page.js` | Admin conflict-log UI | Done (PR #30) |
| `frontend/src/app/admin/manufacturers/page.js` | Manufacturer onboarding UI | Done (PR #30) |
| `backend/src/routes/passport.js` | Public B2B passport/portfolio/audit API | Done (PR #33) |
| `METHODOLOGY.md` | Full GreenGrade v3.0 technical spec | Done (PR #33) |
| `backend/src/data/products.json` | Product catalog with emission data | Existing |

## Links

- [[Investor Feedback 2026-05-21]] — original feedback that prompted this
- [[GreenGrade Governance Charter 2026-05-29]] — Panel charter (draft v1.0)
- [[Score Audit Service]] — audit trail implementation
- [[Admin Routes]] — admin API endpoints
- [[Digital Product Passport API]] — public B2B passport/portfolio/audit endpoints
- [[Stack Migration Plan]] — future Prisma/Supabase migration
- [[GreenGrade KDE Scoring]] — algorithm details
- [[GreenGrade Service]] — implementation
- [[Data Provenance]] — where emission data comes from
