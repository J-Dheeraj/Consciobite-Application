---
type: entity
title: "Admin Manufacturer Onboarding"
created: 2026-06-21
status: developing
tags: [entity, admin, governance, frontend]
---

# Admin Manufacturer Onboarding

**File:** `frontend/src/app/admin/manufacturers/page.js`
**Route:** `/admin/manufacturers` — requires admin role (same `requireAdmin` gate as other admin pages)
**Shipped:** PR #31 (`feat: add governance frontend`), 2026-05-29 (Session 4)

Admin UI for managing the manufacturer side of the conflict-of-interest tracking system.

---

## Capabilities

- **Create manufacturer** — form with name, email, and an `is_paying` checkbox plus a listing-fee acknowledgement checkbox (`listing_fee_ack`) for paying clients
- **Link product to manufacturer** — associates a product ID with a manufacturer record so [[Score Audit Service]] can resolve `is_paying_client` on score changes
- **Registered manufacturers table** — lists all manufacturers with PAYING/FREE badge and fee-acknowledgement status
- Mutations go through `frontend/src/services/admin.js` (`createManufacturer`, `acknowledgeFee`, `linkProductManufacturer`) via React Query `useMutation`, calling the `/api/admin/manufacturers*` and `/api/admin/product-manufacturer` endpoints documented in [[Admin Routes]]

## Why it exists

The audit trail and transparency page are only meaningful if `product_manufacturers` data is actually populated — this page is the only way to enter that data (no bulk import / migration script exists yet).

## Links

- [[Admin Routes]] — backend endpoints this page calls
- [[Score Audit Service]] — consumes the manufacturer links this page creates
- [[Grading Independence Governance]] — business context
- [[Transparency Page]] — public page whose paying/non-paying split depends on this data being correct
