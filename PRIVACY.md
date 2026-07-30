# Privacy Notice — Consciobite

_Last updated: 2026-07-30_

This notice describes what personal data Consciobite stores, why, and the
controls available to you. Consciobite is currently operated as a pilot;
do not use it with data you cannot afford to lose or expose.

## What we store

| Data | Purpose | Where |
|---|---|---|
| Email address, display name, password hash (bcrypt, cost 12) | Account authentication | `users` table |
| Product reviews (rating, comment, timestamps) | Community reviews feature | `reviews` table |
| Carbon log entries (product, quantity, emissions, timestamps) | Personal carbon-footprint tracking | `carbon_logs` table |
| Revoked token identifiers (`jti`, expiry) | Logout revocation | `revoked_tokens` table |
| Request logs (method, path, status, duration, request ID) | Operations and debugging | Application logs |

**Carbon history is behavioural data**: it can reveal purchasing habits.
It is stored only against your account ID and is never shared or sold.

We do not store: plaintext passwords, payment details, precise location,
or third-party tracking identifiers. Authentication tokens are not
persisted in browser storage (in-memory + httpOnly cookie only).

## Your controls

- **Export** — `GET /api/auth/export` (authenticated) returns everything we
  store about you as JSON: profile, reviews, and carbon logs.
- **Delete** — `DELETE /api/auth/account` (authenticated, requires your
  password in the request body) permanently deletes your account, reviews,
  carbon history, and token records in a single transaction.
- **Logout everywhere for this token** — `POST /api/auth/logout` revokes the
  presented token immediately; it cannot be replayed.

## Retention

- Account data: retained until you delete your account.
- Revoked-token records: purged automatically after the token's natural
  expiry passes.
- Application logs: retained per hosting-platform defaults (Render);
  request logs contain request IDs and routes, not request bodies.

## Known limitations (pilot status)

- The database currently runs on ephemeral infrastructure without managed
  backups; durability is not guaranteed. Deletion is therefore also
  trivially permanent.
- There is no data-residency guarantee; the pilot is hosted on Render
  (region as configured in `render.yaml`).
- Database-at-rest encryption depends on the hosting platform's disk
  encryption; no application-level field encryption is applied.

## Contact

Privacy questions: rajdheeraj26@gmail.com
