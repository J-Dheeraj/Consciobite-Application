---
type: source
title: "GreenGrade v3.0 Technical Specification"
created: 2026-06-26
status: permanent
tags: [source, methodology, b2b, technical-spec]
---

# GreenGrade v3.0 Technical Specification

**Date:** 2026-06-07 (commit `8d7ead3`)
**Source type:** Public technical documentation
**File:** `/METHODOLOGY.md` (repo root)

---

## Summary

Full written technical specification of the GreenGrade scoring algorithm, published alongside the Digital Product Passport API as B2B-facing documentation (EU ESPR / SGX Scope 3 audiences need a citable methodology doc, not just API responses). Formalizes what was previously only documented in [[GreenGrade KDE Scoring]] and the graphify audit.

## Structure

1. Scope — 0-10 score, 7 emission categories, relative-to-catalog (not absolute-threshold) scoring
2. Emission categories — same 7 dimensions as [[GreenGrade Algorithm]] (Land Use Change, Animal Feed, Farm, Processing, Transport, Packaging, Retail), all in kg CO2e/kg product
3. Scoring pipeline — training phase (`trainModel()`, per-dimension + per-category KDE models, variance-based feature weights, per-category covariance matrices) → query-time KDE/sigmoid scoring
4. Bandwidth selection — Silverman's rule of thumb, floored at 0.001 to avoid degenerate zero-bandwidth cases

## Relationship to existing wiki pages

This is documentation of the *same* algorithm already covered by [[GreenGrade Algorithm]] and [[GreenGrade KDE Scoring]] — no algorithm change shipped with this commit. Treat `METHODOLOGY.md` as the canonical citable version going forward; the wiki pages remain the internal working notes.

## Links

- [[GreenGrade Algorithm]]
- [[GreenGrade KDE Scoring]]
- [[Digital Product Passport API]] — consumes this methodology for external-facing data
