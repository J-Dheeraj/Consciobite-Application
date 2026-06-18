---
type: domain
title: "Grading Independence & Governance"
created: 2026-05-21
updated: 2026-06-18
status: developing
tags: [governance, grading, independence, business-model, investor-feedback]
---

# Grading Independence & Governance

Cross-cutting concern: ensuring GreenGrade scoring is (and is perceived as) independent of commercial relationships.

---

## The Problem

Consciobite charges manufacturers for listing and grading. GreenGrade scores claim to be objective. These two facts create a conflict of interest that investors, regulators, and retail partners will flag.

## Current State (updated 2026-06-18)

- **Phase 2 items 1, 3 and 4 confirmed live in code** (verified by reading the actual files, not just the plan): `/methodology` and `/transparency` pages both exist and render (`frontend/src/app/methodology/page.js`, `frontend/src/app/transparency/page.js`), and the audit trail is now also exposed externally at `GET /api/v1/audit/:productId` ([[Digital Product Passport API]]), not just via the admin-only conflict log.
- `/transparency` currently shows all 3 Panel seats as "In Formation" (no names yet) — sourcing founding candidates is a business task, not blocked on engineering.
- Remaining open Phase 2 item: **item 2, a version-controlled changelog for GreenGrade *algorithm parameter* changes** (weights/thresholds/category definitions) — distinct from the existing per-product score audit trail. `methodology_version` is currently a hardcoded string (`"3.0"`) in `passport.js`; there's no log of when/why that version number changed.


- GreenGrade algorithm is deterministic (KDE + sigmoid, 7 emission dimensions) — see [[GreenGrade KDE Scoring]]
- Methodology page exists at `/methodology` in the frontend
- **Audit trail implemented** — [[Score Audit Service]] logs every score change with paying-client flag
- **Admin conflict log** — [[Admin Routes]] at `/api/admin/conflict-log` with paying/non-paying filter and aggregate stats
- **Manufacturer tracking** — `manufacturers` + `product_manufacturers` tables in SQLite
- **Score snapshots** — 550 product scores captured on every server startup; drift auto-detected
- **Governance charter drafted** — [[GreenGrade Governance Charter 2026-05-29]] defines Panel composition, mandate, firewall, access rights, and cadence. Ready for founding member review.
- **Landing page updated** — "Independent Scoring" copy replaces "No Pay-to-Win"; product count corrected to 550
- Advisory board not yet formed (candidates to be identified)
- Public disclosure page now live at `/transparency` (seats shown as "In Formation" pending candidates)

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
3. ~~Publish on website at `/transparency`~~ — done, page is live with placeholder "In Formation" seats
4. First Panel meeting within 90 days of acceptance

### Phase 2 — Transparency Features (code changes)

1. ~~**Public methodology page enhancement**~~ — done. `/methodology` page live; `METHODOLOGY.md` (repo root, added 2026-06-07) gives the full v3.0 spec for external/compliance readers
2. **Scoring changelog** (still open) — version-controlled log of any changes to GreenGrade *parameters* (weights, thresholds, category definitions). Distinct from the per-product score audit — this would track changes to the algorithm itself across versions (e.g. v2 → v3). `methodology_version` is a hardcoded string today.
3. ~~**Board disclosure page**~~ — done as far as engineering goes. `/transparency` is live with seat cards, commitments, and live score-change stats; seats themselves are still "In Formation" (real names pending — not an engineering task)
4. ~~**Audit trail**~~ — done. [[Score Audit Service]] + [[Admin Routes]] conflict log, and now also externally via `GET /api/v1/audit/:productId` ([[Digital Product Passport API]])

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
| `frontend/src/app/transparency/page.js` | Public governance & stats page | Done (seats pending real names) |
| `backend/src/routes/passport.js` | External `/api/v1/audit/:productId` | Done (2026-06-07) |
| `backend/src/data/products.json` | Product catalog with emission data | Existing |

## Links

- [[Investor Feedback 2026-05-21]] — original feedback that prompted this
- [[GreenGrade Governance Charter 2026-05-29]] — Panel charter (draft v1.0)
- [[Score Audit Service]] — audit trail implementation
- [[Admin Routes]] — admin API endpoints
- [[Stack Migration Plan]] — future Prisma/Supabase migration
- [[GreenGrade KDE Scoring]] — algorithm details
- [[Digital Product Passport API]] — external audit + passport endpoints
- [[GreenGrade Service]] — implementation
- [[Data Provenance]] — where emission data comes from
