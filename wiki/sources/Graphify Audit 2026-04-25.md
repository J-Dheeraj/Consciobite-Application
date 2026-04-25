---
type: source
title: "Graphify Audit 2026-04-25"
created: 2026-04-25
updated: 2026-04-25
status: mature
tags: [audit, graphify, security, accessibility]
related: ["[[Backend Security]]", "[[Frontend Accessibility]]", "[[Frontend Error Handling]]", "[[validate() Middleware]]", "[[Auth-Expired Event Bus]]"]
sources: ["[[.raw/graphify-audit-2026-04-25.md]]"]
---

# Graphify Audit 2026-04-25

Full-codebase knowledge graph analysis of Consciobite using graphify (PyPI: `graphifyy`). AST + LLM semantic extraction, Leiden community detection, 255 nodes, 45 communities.

## Findings Summary

23 total findings. 2 false positives. All 21 real findings resolved across 3 commits.

| Commit | Description |
|--------|-------------|
| 17779d2 | RequireAuth route guard + CarbonTracker auth gate removed |
| 362009b | validate() wired into carbon POST/DELETE and products /compare |
| 8d50d17 | All 19 remaining findings |

## Backend Findings (14)

| # | Status | Finding |
|---|--------|---------|
| B1 | ✅ | CORS pattern hardcoded → `ALLOWED_ORIGIN_PATTERN` env var |
| B2 | ❌ | Cache key scope — false positive (public routes only) |
| B3 | ✅ | Async handlers without try-catch in products.js |
| B4 | ❌ | Empty catch in auth middleware — false positive (intentional) |
| B5 | ✅ | POST /reviews missing validate() |
| B6 | ✅ | GET/DELETE /reviews missing validate() |
| B7 | ✅ | GET /carbon/logs pagination missing validate() |
| B8 | ✅ | GET /recipes tag/id missing validate() |
| B9 | ✅ | Magic number `10000` → `OPEN_FOOD_FACTS_TIMEOUT_MS` |
| B10 | ✅ | auth.js constants — already named, no change needed |
| B11 | ✅ | `PORT` default → `DEFAULT_PORT = 4000` |
| B12 | ✅ | products.json loaded with no startup schema check |
| B13 | ✅ | calculateGreenGrade() fallback verified; no throw path |
| B14 | ✅ | `"auth-expired"` string duplicated across 2 files → `AUTH_EXPIRED_EVENT` |

## Frontend Findings (9)

| # | Status | Finding |
|---|--------|---------|
| F1 | ✅ | CarbonTracker delete catch `/* ignore */` |
| F2 | ✅ | ReviewSection fetchReviews catch `/* ignore */` |
| F3 | ✅ | ReviewSection deleteReview catch `/* ignore */` |
| F4 | ✅ | ProductDetail logCarbonPurchase catch `/* ignore */` |
| F5 | ✅ | Compare initial fetchProducts failure silently emptied list |
| F6 | ✅ | CarbonTracker delete button missing aria-label |
| F7 | ✅ | Tips expand/collapse button missing aria-label + aria-expanded |
| F8 | ✅ | Recipes expand/collapse button missing aria-label + aria-expanded |
| F9 | ✅ | `weeklyGoal = 10` hardcoded → `WEEKLY_CARBON_GOAL_KG` constant |

## Notable Discoveries

**Invisible coupling found by graph:** `safeFetch()` in `api.js` fires `window.dispatchEvent(new Event("auth-expired"))` on 401. `AuthContext.js` listens on the same string. AST cannot see this equality — the graph flagged the two nodes as disconnected communities. Fixing it required extracting `AUTH_EXPIRED_EVENT` to a shared constant. See [[Auth-Expired Event Bus]].

**validate() was orphaned:** The `validate()` middleware existed in `src/middleware/validate.js` but was imported by zero route files before this audit. The graph showed it as a weakly-connected node with no in-edges from production code.
