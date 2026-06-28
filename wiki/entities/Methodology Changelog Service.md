---
type: entity
title: "Methodology Changelog Service"
created: 2026-06-28
status: developing
tags: [entity, governance, audit, methodology]
---

# Methodology Changelog Service

**File:** `backend/src/services/methodologyChangelog.js`

Versioned audit trail for changes to the GreenGrade **algorithm itself** (weights, blend ratios, sigmoid parameters) — distinct from [[Score Audit Service]], which audits *per-product score* deltas. Closes a gap identified 2026-06-28: `methodology_version` was previously a hardcoded `"3.0"` string duplicated in `backend/src/services/dataProvenance.js` and `backend/src/routes/passport.js`, with nothing recording when or why it changed.

---

## Exports

| Function | Purpose |
|----------|---------|
| `getCurrentVersion()` | Returns the most recently released row from `methodology_versions` (by `released_at`), or `null` if the table is empty |
| `getChangelog({ limit, offset })` | Paginated version history, newest first; returns `{ entries, totalEntries }` |
| `recordVersion({ version, summary, changedParams, releasedBy })` | Inserts a new version row; `changedParams` is JSON-serialized; throws on duplicate `version` (UNIQUE constraint) |

## Database Table

`methodology_versions` (migration `003_methodology_changelog.sql`):

| Column | Notes |
|--------|-------|
| `version` | UNIQUE, e.g. `"3.0"`, `"3.1.0"` |
| `summary` | Human-readable description of what changed and why |
| `changed_params` | JSON blob of the specific parameters that moved (e.g. `{"sigmoid":{"k":5,"midpoint":0.45}}`) |
| `released_by` | Admin user ID, or `"system"` for the seeded baseline |

The migration backfills a `"3.0"` seed row describing the current baseline (KDE + sigmoid, 60/40 blend, Mahalanobis anomaly detection) so the table is never empty in a fresh deploy.

## API Surface

- `GET /api/methodology/changelog` — public, paginated (`limit`/`offset`, max 100)
- `POST /api/admin/methodology-version` — admin only (`requireAdmin`), body `{ version, summary, changedParams? }`, returns 201 with the new current version or 409 on duplicate version

## Consumers

- `backend/src/services/dataProvenance.js` → `getMethodology().version`
- `backend/src/routes/passport.js` → `buildPassport().methodology_version` (called once per product, so up to 100 DB reads per `/v1/portfolio/score` request — acceptable given the table is tiny and indexed on `released_at`, not worth caching yet)

## Known Gap

Nothing in code enforces that a `greengrade.js` parameter change is paired with a `POST /api/admin/methodology-version` call — it relies on the engineer remembering. Not built out further per Karpathy "simplicity first" (no speculative drift-detection mechanism without a concrete need yet).

## Links

- [[Score Audit Service]] — sibling audit trail, but for per-product scores not algorithm parameters
- [[Grading Independence Governance]] — business context, Phase 2 item 2
- [[GreenGrade KDE Scoring]] — the algorithm whose parameters this versions
