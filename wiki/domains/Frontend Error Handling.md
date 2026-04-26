---
type: domain
title: "Frontend Error Handling"
created: 2026-04-25
updated: 2026-04-25
status: mature
tags: [error-handling, ux, frontend]
related: ["[[CarbonTracker Component]]", "[[Frontend Accessibility]]"]
sources: ["[[.raw/graphify-audit-2026-04-25.md]]"]
---

# Frontend Error Handling

Pre-audit, five async catch blocks silently discarded errors (`/* ignore */`). All five replaced in commit 8d50d17.

## Pattern Used

Each fix follows the same three-step pattern:
1. Add a new `useState` for the error message.
2. In the catch block, call `setState(err.message || "Fallback message.")`.
3. Render the state as an `<alert>` element with `role="alert" aria-live="assertive"`.

## Fixes

| Component | Action that failed | Error state | Display location |
|-----------|-------------------|-------------|-----------------|
| `CarbonTracker` | `deleteCarbonLog()` | `deleteError` | Alert banner below query error |
| `ReviewSection` | `fetchReviews()` | `loadError` | Above the reviews list |
| `ReviewSection` | `deleteReview()` | Existing `error` state | Below review form |
| `ProductDetail` | `logCarbonPurchase()` | `logError` | Below Log Purchase button |
| `Compare` | Initial `fetchProducts()` | Existing `error` state | Above comparison results |

## Pre-existing vs New State

`ReviewSection` and `Compare` already had `error` state for other operations — the fix routed new failures through the same state rather than adding redundant variables.

## Note on `/* ignore */`

Silent error swallowing is appropriate when failure truly doesn't affect the user (e.g. a non-critical analytics ping). None of the five cases qualified — they all affected visible UI state.
