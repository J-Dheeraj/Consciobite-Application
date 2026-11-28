# Privacy Notice — Consciobite

_Last updated: 2026-11-28_

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

## Where your data is held

- **Database:** account, review, carbon-log and token records are stored in a
  hosted [Turso](https://turso.tech) database (libSQL) in AWS `us-west-2`
  (Oregon, USA).
- **API server:** the API runs on Render in its Oregon (USA) region. It keeps
  a local copy of the database (a Turso embedded replica) on the server's
  disk, which is replaced from the hosted database on each restart.
- **Logs:** application logs are held by Render.

## Known limitations (pilot status)

- **Deletion and backups.** Deleting your account removes your records from
  the live database immediately. Turso keeps point-in-time restore history,
  so a copy of deleted data can remain in that history until it ages out
  under Turso's retention for the plan in use. Data restored from that
  history would bring deleted records back.
- **Data residency.** Data is held in the United States (see above). There is
  no option to choose another region.
- **Encryption at rest** depends on Turso's and Render's infrastructure; no
  application-level field encryption is applied. Connections between the API
  and Turso use TLS.

## Contact

Privacy questions: rajdheeraj26@gmail.com
