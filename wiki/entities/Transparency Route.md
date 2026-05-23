---
type: entity
title: "Transparency Route"
created: 2026-05-23
status: stable
tags: [entity, governance, transparency, routes]
---

# Transparency Route

**File:** `backend/src/routes/transparency.js`
**Mounted at:** `/api/transparency`
**Protection:** None — public endpoint

---

## Endpoint

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/transparency` | Public governance & audit stats |

## Response Shape

```json
{
  "methodologyVersion": "3.0",
  "governanceCommitments": [
    { "commitment": "Scoring independence", "detail": "..." },
    { "commitment": "Audit trail", "detail": "..." },
    { "commitment": "Methodology transparency", "detail": "..." },
    { "commitment": "Advisory oversight", "detail": "..." }
  ],
  "advisoryBoard": {
    "status": "forming",
    "description": "...",
    "seats": [
      { "role": "Academic", "mandate": "...", "filled": false },
      { "role": "Regulatory", "mandate": "...", "filled": false },
      { "role": "Industry", "mandate": "...", "filled": false }
    ],
    "mandate": ["Annual audit", "Sign-off on changes", "Published audit summary", "COI register"]
  },
  "auditStats": {
    "totalScoreChanges": 0,
    "payingClients": { "changes": 0, "avgDelta": 0, "increases": 0, "decreases": 0 },
    "nonPayingClients": { "changes": 0, "avgDelta": 0, "increases": 0, "decreases": 0 }
  },
  "lastUpdated": "2026-05-23"
}
```

## Design Notes

- `auditStats` is sourced from `getConflictStats()` in `scoreAudit.js` — returns 12-month aggregates only, no individual log entries (safe for public)
- If DB is unavailable, `auditStats` is `null` (graceful fallback)
- No CSRF protection needed (read-only GET)

## Links

- [[Score Audit Service]] — provides `getConflictStats()`
- [[Admin Routes]] — protected admin log at `/api/admin/conflict-log`
- [[Grading Independence Governance]] — business context
