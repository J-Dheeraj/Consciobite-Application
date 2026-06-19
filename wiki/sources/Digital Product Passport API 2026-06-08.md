---
type: source
title: "Digital Product Passport API (PR #33)"
created: 2026-06-08
status: permanent
tags: [source, b2b, passport, methodology, api]
---

# Digital Product Passport API (PR #33)

**Date merged:** 2026-06-08
**Branch:** `claude/improve-application-S5njo` → `main`
**Commit:** `8d7ead3`

---

## Summary

B2B pivot: adds machine-readable per-product sustainability passports and portfolio scoring aimed at corporate ESG reporting (EU ESPR, SGX Scope 3), plus a full technical methodology spec and a cold-start UX fix for the Render free-tier backend.

## Changes

1. **`backend/src/routes/passport.js`** (new) — three endpoints, see [[Digital Product Passport API]]
2. **`METHODOLOGY.md`** (new, repo root) — full GreenGrade v3.0 spec: KDE bandwidth selection, CDF blending, sigmoid transform, anomaly detection. Formalizes what [[GreenGrade KDE Scoring]] already described informally.
3. **`README.md`** rewritten — B2B framing, removes "student project" language (continuation of the positioning shift started by the governance charter).
4. **`frontend/src/components/ApiReadyGate.js`** (new) — polls `/health` every 3s for up to 60s before rendering children; covers Render free-tier cold starts (backend sleeps after inactivity, takes 30–60s to wake).
5. **`backend/src/swagger.js`** — docs added for all three passport endpoints.
6. **`backend/src/index.js`** — mounts passport router.

## Why

Same underlying conflict-of-interest narrative as [[Grading Independence Governance]] — turning the audit trail and methodology transparency into externally-consumable, citable artifacts (passports, portfolio reports) makes independence verifiable by third parties (auditors, ESG software vendors) rather than just asserted.

## Links

- [[Digital Product Passport API]] — entity page for the three routes
- [[GreenGrade KDE Scoring]] — algorithm now formally specified in METHODOLOGY.md
- [[Score Audit Service]] — backs the `GET /audit/:productId` endpoint
- [[Grading Independence Governance]] — business context this continues
