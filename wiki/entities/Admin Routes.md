---
type: entity
title: "Admin Routes"
created: 2026-05-21
status: developing
tags: [entity, admin, governance, routes]
---

# Admin Routes

**File:** `backend/src/routes/admin.js`
**Mounted at:** `/api/admin/*` and `/api/v1/admin/*` (versioned alias, added 2026-05-29 alongside the integration test suite)
**Protection:** `requireAdmin` middleware (all routes), `csrfProtection` (mutating routes via mount in index.js)

A public, unauthenticated sibling endpoint exists at `GET /api/transparency/stats` (`backend/src/index.js`, cached 5 min) — returns conflict stats + product/manufacturer/paying counts for the frontend [[Grading Independence Governance|transparency page]] without exposing per-manufacturer detail.

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/admin/conflict-log` | Score change audit log with paying/non-paying filter + aggregate stats |
| `POST` | `/api/admin/rescore` | Rescore all 550 products, log any changes |
| `POST` | `/api/admin/manufacturers` | Create a manufacturer record |
| `GET` | `/api/admin/manufacturers` | List all manufacturers |
| `POST` | `/api/admin/product-manufacturer` | Link a product ID to a manufacturer |
| `POST` | `/api/admin/manufacturers/:id/acknowledge-fee` | Record listing fee acknowledgement |

## Auth

Uses `requireAdmin` middleware from `backend/src/middleware/auth.js`:
1. Extracts JWT from Bearer header or httpOnly cookie
2. Verifies token
3. Looks up `users.role` in SQLite
4. Requires `role = 'admin'`

**No admin users exist by default.** To create one, manually update a user's role:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

## Conflict Log Response Shape

```json
{
  "logs": [
    {
      "id": "uuid",
      "product_id": "1",
      "product_name": "Firm Tofu",
      "manufacturer_id": "uuid or null",
      "is_paying_client": 0,
      "old_score": 8.4,
      "new_score": 8.2,
      "score_delta": -0.2,
      "changed_at": "2026-05-21T...",
      "changed_by": "system",
      "change_reason": "Model retrain / algorithm update"
    }
  ],
  "stats": {
    "totalChanges": 0,
    "paying": { "count": 0, "avgDelta": 0, "increases": 0, "decreases": 0 },
    "nonPaying": { "count": 0, "avgDelta": 0, "increases": 0, "decreases": 0 }
  }
}
```

## Frontend consumers

- `frontend/src/app/admin/conflict-log/page.js` — summary stats, paying/non-paying filters, rescore button, full audit table
- `frontend/src/app/admin/manufacturers/page.js` — create manufacturer (with fee-acknowledgement checkbox), product-manufacturer linking, registered manufacturers table
- `frontend/src/app/transparency/page.js` — public page rendering `/api/transparency/stats` + governance/panel copy
- `frontend/src/services/admin.js` — service module these pages call through (no raw `fetch()` in components, per convention)

## Tests

`backend/__tests__/admin.test.js` — 20 integration tests covering `requireAdmin` auth (401/403/200), conflict-log filters, rescore, manufacturer CRUD, product-manufacturer linking, fee acknowledgement, score snapshot verification, paying-client flag propagation, and the `/api/v1/admin` alias.

## Links

- [[Score Audit Service]] — service layer these routes call
- [[validate() Middleware]] — input validation pattern used
- [[Grading Independence Governance]] — business context
- [[Digital Product Passport API]] — public per-product audit trail endpoint
