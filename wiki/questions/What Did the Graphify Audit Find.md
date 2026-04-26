---
type: question
title: "What Did the Graphify Audit Find"
created: 2026-04-25
updated: 2026-04-25
status: mature
tags: [audit, graphify, summary]
related: ["[[Graphify Audit 2026-04-25]]", "[[Backend Security]]", "[[Frontend Error Handling]]", "[[Frontend Accessibility]]"]
sources: ["[[.raw/graphify-audit-2026-04-25.md]]"]
---

# What Did the Graphify Audit Find?

The graphify knowledge graph analysis (2026-04-25) identified 23 findings across the full Consciobite codebase. All were resolved within the same session.

## Most Significant Discoveries

**1. validate() middleware was entirely orphaned.**
The middleware existed but was imported by zero route files. The graph showed it as a weakly-connected node with no in-edges from production code. Fixed: wired into 9 endpoints across 4 route files.

**2. auth-expired event bus coupling was invisible to AST.**
`api.js` and `AuthContext.js` share a raw string `"auth-expired"` — the event bus that triggers automatic logout on 401. AST sees two separate string literals with no syntactic relationship. Only the graph's LLM-semantic edges flagged them as connected. Fixed: `AUTH_EXPIRED_EVENT` constant in `constants.js`.

**3. products.json trained a KDE model with no validation.**
The 550-product catalog feeds the GreenGrade ML model at startup. Malformed entries (missing emission keys) would silently degrade scoring without any error. Fixed: `validateProductCatalog()` startup check.

**4. Five silent catch blocks.**
`/* ignore */` comments in critical user-facing operations — delete, load-reviews, log-purchase, compare-load. Users had no feedback on failures. Fixed: all five surface errors.

**5. Three accessibility gaps.**
Expand/collapse buttons in Tips and Recipes had no accessible text. CarbonTracker delete button had `title` but no `aria-label`. Fixed: `aria-expanded` + `aria-label` added to all three.

## False Positives

- **B2 (cache key scope):** The audit flagged that cache keys only use `req.originalUrl`. On inspection, only public routes are cached — no per-user data is at risk.
- **B4 (empty auth catch):** The audit flagged an empty catch in `requireAuth`. On inspection, both `requireAuth` (returns 401) and `optionalAuth` (continues without user) have intentional catch behaviour.

## By Numbers

| Category | Count | Status |
|----------|-------|--------|
| Backend security/correctness | 6 | 4 ✅, 2 ❌ |
| Backend constants/config | 3 | 3 ✅ |
| Backend data integrity | 2 | 2 ✅ |
| Backend coupling | 1 | 1 ✅ |
| Frontend silent errors | 5 | 5 ✅ |
| Frontend accessibility | 3 | 3 ✅ |
| Frontend hardcoded values | 1 | 1 ✅ |
| **Total** | **21+2** | **21 ✅, 2 ❌** |
