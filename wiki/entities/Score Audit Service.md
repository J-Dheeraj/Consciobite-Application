---
type: entity
title: "Score Audit Service"
created: 2026-05-21
status: developing
tags: [entity, governance, audit, scoring]
---

# Score Audit Service

**File:** `backend/src/services/scoreAudit.js`

Core service for the governance layer. Provides an audit trail for every GreenGrade score change, with paying-client attribution.

---

## Exports

| Function | Purpose |
|----------|---------|
| `logScoreChange({ productId, productName, oldScore, newScore, changedBy, changeReason })` | Records a single score change to `score_change_logs`, auto-resolving manufacturer/paying status via `product_manufacturers` join |
| `snapshotScores(products, scoreFn)` | Scores all products, compares against `product_scores` snapshot, logs any changes, returns array of changed products |
| `getConflictLog({ filter, limit, offset })` | Queries `score_change_logs` with optional paying/non-paying filter |
| `getConflictStats()` | Returns 12-month aggregate: total changes, paying vs non-paying counts, avg deltas, increase/decrease counts |

## Data Flow

```
Server startup
  → trainModel(products)
  → snapshotScores(products, calculateGreenGrade)
    → For each product:
      → Score product
      → Compare against product_scores snapshot
      → If changed: logScoreChange() → INSERT into score_change_logs
      → Update product_scores snapshot
```

## Database Tables Used

- `product_scores` — last-known score per product (detect drift)
- `score_change_logs` — full audit trail with paying-client flag
- `product_manufacturers` + `manufacturers` — JOIN to resolve `is_paying_client`

## Key Design Decisions

- **Synchronous better-sqlite3 calls** — matches existing codebase pattern
- **UUID primary keys** via `crypto.randomUUID()` — consistent with existing tables
- **Score delta pre-computed** — `parseFloat((newScore - oldScore).toFixed(4))` avoids floating-point display issues
- **No-op on equal scores** — `logScoreChange` returns early if `oldScore === newScore`

## Links

- [[GreenGrade Service]] — the scoring algorithm whose output is audited
- [[Grading Independence Governance]] — business context
