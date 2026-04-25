---
type: entity
title: "CarbonTracker Component"
created: 2026-04-25
updated: 2026-04-25
status: mature
tags: [frontend, component, carbon, react]
related: ["[[RequireAuth Guard]]", "[[Auth-Expired Event Bus]]", "[[Frontend Error Handling]]"]
sources: ["[[.raw/graphify-audit-2026-04-25.md]]"]
---

# CarbonTracker Component

`frontend/src/pages/CarbonTracker.js`

Protected page (requires auth via [[RequireAuth Guard]]). Displays weekly/monthly/all-time carbon totals, trend chart, top-impact products, and recent purchase logs.

## Data

Fetches via `Promise.all([fetchCarbonSummary(), fetchCarbonLogs()])` using TanStack React Query (`queryKey: ["carbon"]`).

## Constants

- `WEEKLY_CARBON_GOAL_KG` — imported from `src/utils/constants.js`. Default 10 kg CO₂e/week. Used for the progress bar and colour coding the "This Week" summary card.

## Mutations

`handleDelete(id)` — calls `deleteCarbonLog(id)`, then invalidates the `["carbon"]` query to refresh the UI.

## Error States (post-audit)

| State | Source | Display |
|-------|--------|---------|
| `error` | useQuery failure | Alert banner (was already present) |
| `deleteError` | handleDelete failure | Alert banner (added commit 8d50d17) |

## Accessibility (post-audit)

Delete button: `aria-label="Remove log for {product_name}"` (commit 8d50d17). Previously had only a `title` attribute.
