---
type: entity
title: "validate() Middleware"
created: 2026-04-25
updated: 2026-04-25
status: mature
tags: [middleware, validation, express, backend]
related: ["[[Validate Middleware Pattern]]", "[[Backend Security]]"]
sources: ["[[.raw/graphify-audit-2026-04-25.md]]"]
---

# validate() Middleware

`backend/src/middleware/validate.js`

Schema-driven request validation middleware for Express. Checks `req.body`, `req.query`, and `req.params` against a declared schema and calls `next(new AppError(msg, 400))` on the first violation.

## Usage

```js
const { validate } = require("../middleware/validate");
router.post("/route", requireAuth, validate(SCHEMA), handler);
```

## Key Invariant

Query params arrive as strings — use `pattern: /^\d+$/` for numeric fields, not `type: "number"`.

See [[Validate Middleware Pattern]] for full schema reference and route inventory.

## Pre-audit State

Was imported by zero production files — a "dead node" in the graphify knowledge graph. The audit identified it as an orphaned utility and wired it into 9 route endpoints.
