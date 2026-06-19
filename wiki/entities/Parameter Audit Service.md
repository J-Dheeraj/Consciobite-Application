---
type: entity
title: "Parameter Audit Service"
created: 2026-06-19
status: developing
tags: [entity, governance, audit, scoring]
---

# Parameter Audit Service

**File:** `backend/src/services/parameterAudit.js`

Audits changes to GreenGrade's hardcoded scoring parameters (fallback maximums, anomaly chi-squared threshold, category/global blend weights). Complements [[Score Audit Service]], which audits per-product score changes — this tracks changes to the algorithm's own constants, addressing Phase 2 item 4 of [[Grading Independence Governance]].

---

## Exports

| Function | Purpose |
|----------|---------|
| `checkAndLogParameterChange(parameters)` | Hashes the parameter snapshot, compares against the latest `model_parameter_logs` row, inserts a new row only if the hash differs (or none exists yet). No-op if unchanged. |
| `getParameterLog({ limit, offset })` | Returns parameter log rows, newest first, with `parameters_json` parsed back into an object |

## Data Flow

```
Server startup
  → trainModel(products)
  → getModelParameters()  (greengrade.js — version, fallbackMax, chiSquared95_7df, blendWeights)
  → checkAndLogParameterChange(params)
    → sha256 hash of JSON.stringify(params)
    → Compare against latest model_parameter_logs row
    → If no rows: insert with reason "Initial parameter snapshot"
    → If hash differs: insert with reason "Scoring parameter change detected on startup" + logger.warn
    → If hash matches: no-op (verified idempotent across restarts)
```

## Database Table

`model_parameter_logs` (migration `003_parameter_audit.sql`):
- `id`, `parameters_json`, `parameters_hash`, `changed_at`, `change_reason`

Append-only — every detected change is a new row, never an update. There is intentionally no separate "current parameters" table; the latest row by `changed_at` is the current state.

## API

`GET /api/admin/parameter-log` (requireAdmin) — returns `{ logs: [...] }`, paginated via `limit`/`offset` query params (max 200).

## Key Design Decisions

- **Hash-based change detection**, not field-by-field diffing — mirrors how `snapshotScores` detects drift in [[Score Audit Service]], but for the model's constants rather than its outputs.
- **`getModelParameters()`** lives in `greengrade.js` itself, not duplicated here, so the audited snapshot can never drift from the real constants used at scoring time.
- **Named blend-weight constants** (`CATEGORY_BLEND_WEIGHT` = 0.6, `GLOBAL_BLEND_WEIGHT` = 0.4) replaced the inline magic numbers in `greengrade.js` so they're capturable in the snapshot.

## Links

- [[Score Audit Service]] — sibling service auditing per-product score changes
- [[GreenGrade Service]] — owns `getModelParameters()` and the audited constants
- [[Admin Routes]] — exposes the log via `/api/admin/parameter-log`
- [[Grading Independence Governance]] — Phase 2 item 4, now done
