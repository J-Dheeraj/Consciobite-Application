---
type: concept
title: "Validate Middleware Pattern"
created: 2026-04-25
updated: 2026-04-25
status: mature
tags: [validation, middleware, express, backend]
related: ["[[validate() Middleware]]", "[[Backend Security]]", "[[Graphify Audit 2026-04-25]]"]
sources: ["[[.raw/graphify-audit-2026-04-25.md]]"]
---

# Validate Middleware Pattern

Express middleware at `backend/src/middleware/validate.js` that enforces request schemas declaratively before a route handler runs.

## Schema Format

```js
const MY_SCHEMA = {
  body:   { field: { required, type, min, max, maxLength, pattern, message } },
  query:  { field: { ... } },
  params: { field: { ... } },
};
router.post("/route", validate(MY_SCHEMA), handler);
```

## Supported Rules

| Rule | Applies to | Notes |
|------|-----------|-------|
| `required` | any | Empty string counts as missing |
| `type: "string"` \| `"number"` | any | Uses `typeof` check |
| `min` / `max` | numbers | Value range |
| `minLength` / `maxLength` | strings | Character count |
| `pattern` | strings | RegExp test |
| `message` | any | Custom error text; used for pattern failures |

## Important: Query Params Are Always Strings

Express provides query parameters as strings, not numbers. Using `type: "number"` on a query field will always fail. Use `pattern: /^\d+$/` instead for numeric query params (e.g. pagination).

## Routes Using validate() (post-audit)

| Route | Schema |
|-------|--------|
| POST /api/carbon/log | body: productId, productName, emissions, quantity |
| DELETE /api/carbon/log/:id | params: id (UUID pattern) |
| GET /api/carbon/logs | query: page, limit (digit pattern) |
| GET /api/products/compare | query: ids |
| GET /api/reviews/:productId | params: productId |
| POST /api/reviews/:productId | params: productId; body: rating (1–5), comment |
| DELETE /api/reviews/:reviewId | params: reviewId (UUID pattern) |
| GET /api/recipes | query: tag |
| GET /api/recipes/:id | params: id (slug pattern) |

## History

Before the graphify audit, `validate()` was imported by zero files despite existing as a general-purpose utility — a "dead node" in the knowledge graph. Fixed across commits 362009b and 8d50d17.
