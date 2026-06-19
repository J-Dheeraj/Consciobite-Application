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

## Current State (updated 2026-06-19)

- GreenGrade algorithm is deterministic (KDE + sigmoid, 7 emission dimensions) — see [[GreenGrade KDE Scoring]]
- Methodology page exists at `/methodology` in the frontend, backed by `METHODOLOGY.md` (repo root, GreenGrade v3.0 spec)
- **Audit trail implemented** — [[Score Audit Service]] logs every score change with paying-client flag
- **Parameter audit trail implemented (2026-06-19)** — [[Parameter Audit Service]] hashes and logs changes to GreenGrade's hardcoded constants (fallback maximums, anomaly threshold, blend weights), distinct from per-product score changes. Closes Phase 2 item 4.
- **Admin conflict log** — [[Admin Routes]] at `/api/admin/conflict-log` and `/api/admin/parameter-log`, both with pagination and (for conflict-log) paying/non-paying filtering
- **Manufacturer tracking** — `manufacturers` + `product_manufacturers` tables in SQLite
- **Score snapshots** — 550 product scores captured on every server startup; drift auto-detected
- **Governance charter drafted** — [[GreenGrade Governance Charter 2026-05-29]] defines Panel composition, mandate, firewall, access rights, and cadence. Ready for founding member review.
- **Landing page updated** — "Independent Scoring" copy replaces "No Pay-to-Win"; product count corrected to 550
- **Public transparency page live** — `/transparency` shows panel seats (all "In formation" — no names yet), commitments, methodology summary, and live score-change statistics from `/api/admin/conflict-log` equivalent public endpoint
- **Digital Product Passport API shipped (PR #33, pre-2026-06-19)** — `backend/src/routes/passport.js`: `GET /api/v1/passport/:productId`, `POST /api/v1/portfolio/score`, `GET /api/v1/audit/:productId` (public per-product score audit trail, for EU ESPR / SGX Scope 3 reporting use cases — reframes the existing audit trail as an external transparency feature)
- Advisory board not yet formed (candidates to be identified) — business task, not code
- Board disclosure page shows placeholder seats only; real names/affiliations still pending Panel formation

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

1. **Public methodology page enhancement (done)** — `/methodology` + `METHODOLOGY.md` document the full algorithm, data sources, and confidence scoring. Advisory board member names not yet listed (none confirmed — business blocker, not code).
2. **Scoring changelog (done, 2026-06-19)** — [[Parameter Audit Service]] logs every change to GreenGrade's weights/thresholds (`model_parameter_logs` table), with hash-based change detection on every server startup.
3. **Board disclosure page (partially done)** — `/transparency` exists with seat structure, commitments, and live stats; all 3 seats show "In formation" pending real candidates.
4. **Audit trail for parameter changes (done, 2026-06-19)** — same as item 2, see [[Parameter Audit Service]].

Remaining Phase 2 work is non-technical: identifying and confirming the 3 founding Panel members so the transparency page can show real names instead of placeholders.

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
| `backend/src/services/greengrade.js` | Core scoring algorithm; exports `getModelParameters()` | Existing — wired to both audit services |
| `backend/src/services/parameterAudit.js` | Scoring parameter change audit trail | Done (2026-06-19) |
| `backend/src/db/migrations/003_parameter_audit.sql` | `model_parameter_logs` table | Done (2026-06-19) |
| `frontend/src/app/methodology/page.js` | Public methodology page | Done |
| `frontend/src/app/transparency/page.js` | Public governance & stats page | Done — placeholder Panel seats only |
| `backend/src/routes/passport.js` | Digital Product Passport API; public per-product audit trail at `/api/v1/audit/:productId` | Done (PR #33) |
| `backend/src/data/products.json` | Product catalog with emission data | Existing |

## Links

- [[Investor Feedback 2026-05-21]] — original feedback that prompted this
- [[GreenGrade Governance Charter 2026-05-29]] — Panel charter (draft v1.0)
- [[Score Audit Service]] — per-product score audit trail
- [[Parameter Audit Service]] — scoring parameter (weights/thresholds) audit trail
- [[Admin Routes]] — admin API endpoints
- [[Stack Migration Plan]] — future Prisma/Supabase migration
- [[GreenGrade KDE Scoring]] — algorithm details
- [[GreenGrade Service]] — implementation
- [[Data Provenance]] — where emission data comes from
