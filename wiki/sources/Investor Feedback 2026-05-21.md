---
type: source
title: "Investor Feedback — Grading Independence & Governance"
created: 2026-05-21
status: permanent
tags: [source, investor-feedback, governance, business-model]
---

# Investor Feedback — Grading Independence & Governance

**Date:** 2026-05-21
**Source type:** Investor feedback (direct)

---

## Raw Feedback

> Fix the conflict of interest in the business model before someone else flags it.
>
> Your model charges manufacturers to be listed and graded — but also claims the grading is independent. That tension will come up in every serious pitch to a regulator or retailer, and it's better to resolve it now than to be caught flat-footed. The fix isn't complicated: set up a simple advisory or oversight structure (even three people — an academic, a civil servant (e.g. SFA) and an industry person who isn't a paying client) that audits the grading methodology independently. This is low-cost, and it transforms a weakness into a governance story you can lead with.

## Key Concern

Consciobite's revenue model charges manufacturers for listing and grading on the platform. The GreenGrade scoring system simultaneously claims objectivity and independence. An investor (or regulator, or retailer partner) will see the obvious tension: the entity being paid by manufacturers also determines their sustainability grade.

## Proposed Resolution

Establish an **Independent Grading Advisory Board** with at minimum 3 members:

1. **Academic** — sustainability/food-science researcher (provides scientific credibility)
2. **Civil servant** — e.g. Singapore Food Agency (SFA) representative (provides regulatory legitimacy)
3. **Industry representative** — must NOT be a paying Consciobite client (provides practical relevance without conflict)

### Board Responsibilities
- Annual audit of GreenGrade methodology (KDE scoring, sigmoid normalization, category weights)
- Sign-off on any changes to scoring parameters
- Published audit summary (transparency artifact)
- Conflict-of-interest register for board members

### Why This Matters
- Converts a defensive weakness into a proactive governance narrative
- Low cost to implement (advisory, not executive — no salary, possible honorarium)
- Differentiator vs. competitors who self-certify
- Pre-empts regulatory scrutiny in markets like the EU (Green Claims Directive) and Singapore

## Status

**Action required.** No code changes needed — this is a business/governance initiative. Technical support may be needed later for:
- Public methodology page (already partially exists at `/methodology`)
- Audit trail logging for grade calculation changes
- Board member disclosure page

## Links

- [[GreenGrade KDE Scoring]] — the algorithm under scrutiny
- [[GreenGrade Service]] — implementation details
- [[Grading Independence Governance]] — action plan
