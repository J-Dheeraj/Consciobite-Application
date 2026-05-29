---
type: source
title: "GreenGrade Governance Charter v1.0"
created: 2026-05-29
status: permanent
tags: [source, governance, charter, advisory-panel, independence]
---

# GreenGrade Governance Charter v1.0

**Date:** 2026-05-29
**Source type:** Internal charter (draft for founding member review)
**File:** `/GreenGrade_Governance_Charter.md`

---

## Summary

Founding charter for the GreenGrade Independent Advisory Panel. Defines composition, mandate, conflict-of-interest firewall, access rights, and meeting cadence.

## Panel Composition (3 seats)

| Seat | Profile | Independence Guarantee |
|------|---------|----------------------|
| Academic | Food systems / LCA researcher at recognised university | No consulting for Consciobite or listed manufacturers |
| Regulatory / Civil Society | Current or retired civil servant (FSAI, EPA, CCPC) or consumer advocacy (Which?) | Peer credibility with regulators |
| Industry (non-client) | Retired retail category director or trade association officer | NOT a paying Consciobite client |

Quorum: all 3. Chair rotates annually.

## Four Powers

1. **Methodology audit** — annual review of full algorithm, emission factors, weights, data sources
2. **Score challenge** — any member can trigger a review of any product score; Consciobite responds in 14 days
3. **Conflict-of-interest flag** — formal notice to board; public response required in 30 days; right of dissent
4. **Annual public report** — 500-800 word statement published on website

## Explicit Limit

Panel has no executive authority. Cannot set pricing, accept/reject manufacturers, or direct product development.

## Conflict-of-Interest Firewall

- No paid/unpaid advisory relationship with Consciobite
- No financial interest in any paying client
- No participation in reviews involving personal interests
- 14-day disclosure window for new conflicts
- 12-month cooling-off period after leaving Panel

## Access Rights (read-only)

- Full GreenGrade algorithm + revision history
- Score change audit trail (`/api/admin/conflict-log`)
- Paying client list + listing agreements (under NDA)
- Data provenance citations

## Cadence

| Activity | Frequency |
|----------|-----------|
| Full Panel meeting | Twice yearly (June + December) |
| Methodology audit | Annual (December) |
| Score challenges | As triggered (14-day SLA) |
| Annual public report | January |

## Compensation

Voluntary. Expenses covered. No fees paid (avoids dependency).

## Terms

2-year terms, renewable once (4 years max). Staggered to preserve institutional memory.

## Activation Steps

1. Identify 3 candidates (2 weeks)
2. Share charter for comments (1 week)
3. Publish on website at `/governance` or `/methodology`
4. Add to About page and investor decks
5. First meeting within 90 days of acceptance

## Precedents Cited

- Nutri-Score Scientific Committee
- Rainforest Alliance Verification
- Carbon Trust Standard
- Which? Technical Panel

## Technical Connections

The audit trail infrastructure built in Session 1 directly supports this charter:
- `score_change_logs` table → Panel's read-only access to scoring history
- `manufacturers` + `product_manufacturers` → client relationship tracking
- `GET /api/admin/conflict-log` → the endpoint the Panel accesses during reviews
- `is_paying_client` flag on every score change → the key data point for independence analysis

## Links

- [[Investor Feedback 2026-05-21]] — the feedback that prompted this charter
- [[Grading Independence Governance]] — implementation roadmap
- [[Score Audit Service]] — technical audit trail
- [[Admin Routes]] — API endpoints for Panel access
