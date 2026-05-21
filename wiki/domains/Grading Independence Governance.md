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

## Current State

- GreenGrade algorithm is deterministic (KDE + sigmoid, 7 emission dimensions) — see [[GreenGrade KDE Scoring]]
- Methodology page exists at `/methodology` in the frontend
- No external oversight or audit trail for scoring parameter changes
- No public disclosure of the manufacturer-pays-for-grading model

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

| File | Relevance |
|------|-----------|
| `backend/src/services/greengrade.js` | Core scoring algorithm — any parameter changes need audit trail |
| `frontend/src/app/methodology/page.js` | Public methodology page — expand for transparency |
| `backend/src/data/products.json` | Product catalog with emission data — provenance matters |

## Links

- [[Investor Feedback 2026-05-21]] — original feedback
- [[GreenGrade KDE Scoring]] — algorithm details
- [[GreenGrade Service]] — implementation
- [[Data Provenance]] — where emission data comes from
