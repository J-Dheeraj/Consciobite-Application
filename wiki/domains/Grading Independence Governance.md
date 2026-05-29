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

## Current State (updated 2026-05-21)

- GreenGrade algorithm is deterministic (KDE + sigmoid, 7 emission dimensions) — see [[GreenGrade KDE Scoring]]
- Methodology page exists at `/methodology` in the frontend
- **Audit trail implemented** — [[Score Audit Service]] logs every score change with paying-client flag
- **Admin conflict log** — [[Admin Routes]] at `/api/admin/conflict-log` with paying/non-paying filter and aggregate stats
- **Manufacturer tracking** — `manufacturers` + `product_manufacturers` tables in SQLite
- **Score snapshots** — 550 product scores captured on every server startup; drift auto-detected
- Advisory board not yet formed (business initiative, not code)
- No public disclosure page yet (Session 3 of governance brief)

## Action Plan

### Phase 1 — Advisory Board (immediate, no code)

Set up an **Independent Grading Advisory Board** (3 members minimum):

| Seat | Role | Purpose |
|------|------|---------|
| Academic | Sustainability/food-science researcher | Scientific credibility |
| Regulator | Civil servant (e.g. SFA Singapore) | Regulatory legitimacy |
| Industry | Industry professional (NOT a paying client) | Practical relevance |

**Board mandate:**
- Annual methodology audit
- Sign-off on scoring parameter changes
- Published audit summary
- Conflict-of-interest register

### Phase 2 — Transparency Features (code changes)

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
| `frontend/src/app/methodology/page.js` | Public methodology page — expand for transparency | Existing (linked from transparency page) |
| `frontend/src/app/transparency/page.js` | Public governance & stats page | Done (Session 3) |
| `backend/src/index.js` — `/api/transparency` | Public aggregate scoring integrity endpoint | Done (Session 3) |
| `backend/src/data/products.json` | Product catalog with emission data | Existing |

## Links

- [[Investor Feedback 2026-05-21]] — original feedback
- [[Score Audit Service]] — audit trail implementation
- [[Admin Routes]] — admin API endpoints
- [[Stack Migration Plan]] — future Prisma/Supabase migration
- [[GreenGrade KDE Scoring]] — algorithm details
- [[GreenGrade Service]] — implementation
- [[Data Provenance]] — where emission data comes from
