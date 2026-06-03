---
type: entity
title: "Admin Routes"
created: 2026-05-21
status: developing
tags: [entity, admin, governance, routes]
---

# Admin Routes

**File:** `backend/src/routes/admin.js`
**Mounted at:** `/api/admin/*`
**Protection:** `requireAdmin` middleware (all routes), `csrfProtection` (mutating routes via mount in index.js)
**Public endpoint:** `GET /api/transparency/stats` — in `index.js`, no auth required, cached 5 min

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

## Links

- [[Score Audit Service]] — service layer these routes call
- [[validate() Middleware]] — input validation pattern used
- [[Grading Independence Governance]] — business context
