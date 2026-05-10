---
type: question
title: "Is the GreenGrade Migration Brief Accurate"
question: "Review the GREENGRADE_MIGRATION_BRIEF.md 5-session migration plan against the actual codebase state."
answer_quality: solid
created: 2026-04-25
updated: 2026-04-25
tags: [question, migration, review, greengrade]
related:
  - "[[Consciobite Architecture Overview]]"
  - "[[GreenGrade KDE Scoring]]"
  - "[[Product Catalog Schema]]"
  - "[[Auth-Expired Event Bus]]"
  - "[[Validate Middleware Pattern]]"
  - "[[Backend Security]]"
sources:
  - "[[Graphify Audit 2026-04-25]]"
  - "[[GreenGrade Migration Brief 2026-04-25]]"
status: mature
---

# Is the GreenGrade Migration Brief Accurate?

Short answer: **No.** The brief contains five factual errors about the current codebase and underestimates the scope of Sessions 1 and 2 substantially.

---

## Critical Errors

### 1. Scoring engine is JavaScript, not Python

The brief treats Session 2 as moving an existing Python implementation. The scoring engine is a 536-line JavaScript file at `backend/src/services/greengrade.js` — a full Gaussian KDE implementation with Silverman bandwidth, variance-based feature weighting, 60/40 category/global blending, Mahalanobis anomaly detection (`CHI2_95_7DF = 14.067`), and Tikhonov regularisation. Session 2 is a **complete language rewrite**, not an extraction. (Source: [[GreenGrade KDE Scoring]])

### 2. Styling is not Tailwind

The brief lists Tailwind CSS as the current styling system. There is no `tailwind.config.js`, no tailwind in `frontend/package.json`, and no `@tailwind` directives anywhere. The actual system: `Home.js` uses BEM-like custom CSS classes (`lp-*`); all other pages use 499 inline `style={{}}` objects. Tailwind must be **installed** and all 499 inline style instances converted — this is non-trivial.

### 3. Product count is 550, not 576

The brief states 576 products. `backend/src/data/products.json` contains exactly 550. (Source: [[Product Catalog Schema]])

### 4. Water footprint data does not exist

Session 2 introduces a water footprint calculator using `waterBlue`, `waterGreen`, and `waterGrey` fields. None of these fields exist in `products.json`. The current schema has: `id, name, brand, category, barcode, description, purchaseLinks, emissions, dataSources` — no water fields. Sourcing water footprint data for 550 products is weeks of research work, not a Session 2 coding task.

### 5. Products are in JSON, not SQLite

The brief frames Session 1's product migration as a database-to-database operation. Products are exclusively in `backend/src/data/products.json`, pre-enriched at module load. SQLite contains only `users`, `reviews`, and `carbon_logs`. The "migration" is a **seed-from-JSON operation**. (Source: [[Product Catalog Schema]])

---

## Significant Risks Not Addressed

**GreenGrade Python reimplementation is high-risk.**
The KDE algorithm depends on precise floating-point behaviour in bandwidth calculation, Gaussian CDF, and Mahalanobis distance. A Python reimplementation with `scipy`/`numpy` will produce numerically different scores unless validated against the JavaScript baseline. Recommended: compute scores for all 550 products in both implementations and assert max delta < 0.1 before cutover.

**AUTH_EXPIRED_EVENT event bus disappears without a plan.**
The audit-established `AUTH_EXPIRED_EVENT` constant wires `api.js` (fires on 401) to `AuthContext.js` (clears state). Supabase Auth replaces this with `onAuthStateChange`. The constant and its consumers must be removed cleanly — missed call sites cause silent auth failures. The brief does not flag this. (Source: [[Auth-Expired Event Bus]])

**validate() middleware → Zod schemas.**
The audit wired `validate()` into 9 endpoints across 4 route files. All 9 schemas must become Zod schemas in tRPC procedures. The query-param integer pattern (`/^\d+$/` not `type: "number"`) is a non-obvious quirk — tRPC's `z.coerce.number()` handles this differently and needs testing. (Source: [[Validate Middleware Pattern]])

**`validateProductCatalog()` startup check needs a database equivalent.**
If Session 1 switches products to Supabase reads, the JSON startup validator either needs a database equivalent (query-time schema check) or explicit removal. Silently dropping it recreates the pre-audit data integrity gap.

**Supabase cold-start penalty during Sessions 1–2.**
Upstash Redis (Session 3) mitigates this for read-heavy routes, but Sessions 1–2 tests will see intermittent cold-start failures on Render.com free tier before the cache layer lands.

---

## Architecture Decisions to Confirm

- **tRPC vs REST**: tRPC's type-safe client is TypeScript-only; if native mobile barcode scanning is ever added, the tRPC layer becomes a compatibility problem.
- **Prisma vs Supabase SDK**: Running both creates two type sources. Pick one.
- **FastAPI hosting**: A Python microservice on Render.com free tier compounds cold-starts. Warrant a paid instance or co-locate via process manager.

---

## Session-by-Session Assessment

| Session | Assessment |
|---------|-----------|
| **S1** — Next.js + tRPC + Supabase | Underestimates: Tailwind install + 499 style conversions + AUTH_EXPIRED removal + 9 Zod schemas + validateProductCatalog port |
| **S2** — Python FastAPI GreenGrade | Severely underestimates: full JS→Python rewrite of 536-line algorithm + score-parity validation + water footprint data sourcing |
| **S3** — Upstash Redis | Reasonable, but cache key logic needs revisiting with user-scoped tRPC context |
| **S4** — Next.js App Router | Reasonable, depends on S1 Tailwind completion |
| **S5** — Polish + observability | Realistic if S1–S4 land cleanly |

---

## Recommended Pre-Work

Before Session 1 starts:

1. **Audit inline styles**: `grep -r 'style={{' frontend/src | wc -l` — categorise by type (colour, spacing, layout) to scope Tailwind conversion.
2. **Baseline GreenGrade scores**: Run all 550 products through `greengrade.js` and save as a JSON fixture. Use as acceptance test for Python reimplementation.
3. **Decide on water footprint scope**: If in scope, identify data source (FAO, WaterFootprint.org) and add data-collection sprint before Session 2. If out of scope, remove from Session 2 entirely.
4. **Document AUTH_EXPIRED_EVENT removal**: List the three affected files (`constants.js`, `api.js`, `AuthContext.js`) and the Supabase equivalent in the Session 1 ticket.
