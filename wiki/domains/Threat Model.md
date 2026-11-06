---
type: domain
title: "Threat Model"
created: 2026-10-30
status: developing
tags: [domain, security, threat-model, stride]
---

# Threat Model — Consciobite

STRIDE threat model of the deployed system. Every claim below was checked
against the code or a running instance; items marked **verified** were
reproduced. Companion to [[Backend Security]] and [[Production Readiness]].

**Scope:** `backend/src/**`, `frontend/src/**`, `render.yaml`, CI workflow.
**Reviewed at:** `main` @ `0162ec0` (what production runs) with `fix/real-404`
(PR #50, **unmerged**) as the remediated state.

---

## 1. System overview

| | |
|---|---|
| Architecture | Static SPA + stateless-ish monolith API |
| Frontend | Next.js 14 `output: "export"` — plain HTML/JS on a CDN host |
| API | Node 20 / Express 4, single Render free instance |
| Store | SQLite (better-sqlite3, WAL) on the instance's **ephemeral** disk |
| Identity | JWT HS256, 2 h TTL, `jti` + `revoked_tokens` revocation registry |
| Session transport | httpOnly cookie **and** an in-memory copy in the SPA |
| CSRF | Double-submit token (cookie readable by JS + `X-CSRF-Token` header) |
| Third party | Open Food Facts (outbound only, barcode fallback) |

### Data classification

| Asset | Class | Where |
|---|---|---|
| Password hashes | **Credential** | `users.password_hash` (bcrypt, cost 12) |
| Email, display name | **PII** | `users`, `submitted_evidence.submitter_email` |
| Carbon purchase history | **PII — behavioural** | `carbon_logs` (reveals diet, habits, timing) |
| Session tokens | **Credential** | JWT in cookie + memory; `jti` in `revoked_tokens` |
| Manufacturer fee status | **Business-sensitive** | `manufacturers.is_paying` |
| Score-change audit trail | **Integrity-critical** | `score_change_logs` — the conflict-of-interest evidence |
| Product catalog | Public | `products.json`, baked into the static build |

The audit trail is the asset with the unusual property: its *integrity* matters
more than its confidentiality, because the governance charter's whole claim is
that scores are not altered for paying clients.

---

## 2. Trust boundaries

```
 [B1] Browser ──────────► Static frontend (consciobite-app.onrender.com)
                          no secrets, no server runtime

 [B2] Browser ──────────► API (consciobite-api.onrender.com)
      *** CROSS-SITE ***  onrender.com is on the Public Suffix List,
                          so these are different SITES, not just origins

 [B3] API ──────────────► SQLite (same process, ephemeral disk)

 [B4] API ──────────────► Open Food Facts (outbound, untrusted response)

 [B5] Build ────────────► products.json read at build time by
                          generateStaticParams (Docker context = repo root)

 [B6] GitHub Actions ───► Render deploy (push-to-deploy on main)
```

**B2 is the boundary that breaks assumptions.** Most of this app's auth design
silently assumes same-site. See T-5.

---

## 3. STRIDE analysis

| # | Threat | Component | Risk | Status |
|---|---|---|---|---|
| T-1 | **DoS** — type-confusion crash | `auth.js` login/register/delete | **Critical** | **Verified**; fixed in PR #50 |
| T-2 | **DoS** — cache-key exhaustion | `middleware/cache.js` | High | **Verified**; fixed in PR #50 |
| T-3 | **Spoofing** — limiter bypass | `/api/v1/*` mounts | High | **Verified**; fixed in PR #50 |
| T-4 | **Elevation / Spoofing** — revoked token resurrection | account deletion | High | **Verified**; fixed in PR #50 |
| T-5 | **Spoofing/DoS** — cross-site cookie withheld | `COOKIE_OPTIONS` | High | **Verified**; fixed in PR #50 |
| T-6 | **Tampering/Repudiation** — audit trail is mutable + ephemeral | `score_change_logs` | High | Partly mitigated (append-only + HMAC chain); ephemerality still open |
| T-7 | **Tampering** — CSRF gaps on two mutating surfaces | `DELETE /auth/account`, `/v1/evidence` POSTs | Medium | **Fixed in PR #50** |
| T-8 | **Availability** — total data loss / no backup | ephemeral SQLite | High | Partly mitigated (verified, pruned, relocatable snapshots); durability still open |
| T-9 | **Tampering** — stored XSS via community evidence | `submitted_evidence` | Medium | Mitigated (escape + admin review) |
| T-10 | **DoS** — amplification through OFF | `/products/scan/:barcode` | Low | Mitigated (breaker + limiter) |
| T-11 | **Repudiation** — logout left earlier tokens alive | `logoutHandler` | Low | Mitigated (per-user token epoch) |

---

## 4. Ranked attack paths

### T-1 · Unauthenticated remote crash — CRITICAL, live in production
`POST /api/auth/login {"email": 123}`. The falsy guard passes a non-string;
`validator.normalizeEmail` throws; the handler is `async` and Express 4 does
not catch rejected promises, so Node terminates. **Reproduced**: process dead,
connection refused. No auth, no CSRF needed; repeatable within the 20-req
window. On Render this is a restart loop that also clears the in-memory
lockout map (resetting T-3's defence) on every hit.
*Fixed in PR #50: type guards + `unhandledRejection` handler.*

### T-2 · Unauthenticated read-API outage — HIGH, live
`node-cache` throws `ECACHEFULL` past `maxKeys: 1000`; the key is
`req.originalUrl`, so the key space is attacker-controlled via
`/api/products?search=…`. The throw happens inside `res.json`, surfacing as a
500 for every later cache miss. ~1000 cheap GETs take out the read API for a
TTL window. *Fixed in PR #50: guarded `cache.set`.*

### T-3 · Auth throttle bypass — HIGH, live
Limiters bound to `/api` only, while `ROUTE_TABLE` mounts every router at
`/api` **and** `/api/v1`. **Verified** via `RateLimit-Limit`: `/api/auth` = 20,
`/api/v1/auth` = **200**. Credential stuffing gets a 10× budget; the per-email
lockout still fires, but the throttle `CLAUDE.md` lists as "do not loosen" was
absent on half the surface. *Fixed in PR #50.*

### T-4 · Revoked tokens resurrected by account deletion — HIGH, live
Deletion never revoked the presented token (it kept authenticating routes that
don't re-read `users`) **and** ran `DELETE FROM revoked_tokens WHERE user_id = ?`,
undoing earlier logout revocations. Path: stolen token → victim logs out
(revoked) → victim deletes account → token valid again. *Fixed in PR #50.*

### T-5 · Cross-site cookies never sent — HIGH, live
Both cookies are `SameSite=Strict` while B2 is cross-**site**
(`onrender.com` is on the PSL — **verified**, list line 15560; live API
observed returning `SameSite=Strict`). Browsers withhold them, so cookie-based
session restore and the CSRF double-submit check cannot function in production.
Security effect is subtle: it is not a bypass, it *disables* the CSRF control
by making every protected mutation fail. *Fixed in PR #50 via
`SameSite=None; Secure`, with CSRF and pinned CORS carrying the protection.*

### T-6 · Audit-trail integrity — HIGH, partly mitigated
Three of the five original gaps are closed by migration 009:

- **Append-only enforcement**: `BEFORE UPDATE` and `BEFORE DELETE` triggers on
  `score_change_logs` raise `ABORT`. This stops the application's own code paths
  and casual `sqlite3` edits, not someone who can `DROP` the triggers.
- **Hash chaining + signatures**: every record carries an HMAC-SHA256 over its
  own content chained to the previous record's hash. The key comes from
  `AUDIT_HMAC_KEY` (falling back to `JWT_SECRET`) and is never stored in the
  database, so reaching the SQLite file alone is not enough to recompute a valid
  chain. `verifyAuditChain()` re-walks it; `GET /api/admin/audit-integrity`
  exposes the result and the head hash.

Measured, with the triggers dropped first to model host access: an edited score,
a rewritten `changed_by`, a rewritten `change_reason`, a deleted middle record
and a forged appended record are all detected. Verification with the wrong key
fails, as it must.

Still open:

- **Truncation.** Deleting the newest records leaves a shorter, self-consistent
  chain. Only a known-good head hash reveals it, which is why the admin endpoint
  returns `head` — record it off-host.
- **Key compromise.** An attacker holding `AUDIT_HMAC_KEY` can forge the chain.
  The key is an env var on the same host, so host compromise defeats this.
- **Ephemerality.** A redeploy still erases the table. That is T-8's problem,
  and it needs storage that outlives the host.
- **`changed_by` is still free text**, not an actor FK — deliberately, since
  sentinel values like `system:startup` have no corresponding user row.

So the honest claim is *tamper-evident against a database-level adversary*, not
tamper-proof.

### T-7 · CSRF gaps — MEDIUM, **fixed in PR #50**
`/auth` is mounted with no `csrfProtection` (only `PATCH /me` added it
inline), leaving **`DELETE /api/auth/account`** unguarded; `/api/v1/evidence`
was mounted without it too, so the admin `POST /sources` and
`POST /product-link` relied on `requireAdmin` alone.

Today `SameSite=Strict` masks these — but T-5's fix relaxes that to
`SameSite=None`, at which point they become genuinely reachable. They
therefore had to ship together, and now do.

Fixed surgically rather than by guarding the whole `/auth` mount: `logout`
and `refresh` are called from `AuthContext` with raw `fetch` and no CSRF
header, so a blanket guard would 403 session restore and sign-out. Verified
on a live dev instance: the three endpoints return 403 without a token, while
`logout` still returns 200, `refresh`/`login` return 401 (not 403), and the
public evidence reads are untouched.

## 5. Verified sound — do not re-litigate

- **No IDOR.** Carbon delete scopes `WHERE id = ? AND user_id = ?`; review
  delete checks `review.user_id !== req.user.id` → 403; favourites delete
  scopes by `user_id`.
- **No privilege escalation.** `role` is never accepted from user input;
  `INSERT INTO users` omits it (defaults `'user'`), `PATCH /me` only accepts
  `name` and `weeklyGoal`, and `requireAdmin` re-reads `users.role` from the DB
  rather than trusting the JWT claim.
- **No SQL injection.** All queries parameterised; the one interpolated
  fragment (`getConflictLog`) comes from a fixed two-branch allowlist behind a
  regex-validated `filter`.
- **Admin router is uniformly guarded** — `router.use(requireAdmin)`.
- **Secrets** — `JWT_SECRET` required and length-checked (≥32) in production;
  none committed; Swagger disabled in production.
- **Revocation registry is bounded** — rows written only on logout, each write
  purges expired entries; `jti` is the PK, so the check is an index lookup.

---

## 6. Residual risk

- **T-6 and T-8 are now partly mitigated in-place.** The audit trail is
  append-only and HMAC-chained, and snapshots are verified, pruned and
  relocatable. What remains in both cases is the same single thing: storage that
  outlives the host. No amount of application code supplies that — it needs a
  persistent disk, managed Postgres, or an off-host snapshot target. Tracked in
  [[Production Readiness]].
- **T-8 detail**: `npm run backup` now fails loudly rather than leaving an
  unusable file, keeps the newest `BACKUP_KEEP` snapshots, and writes a
  single self-contained database (not WAL mode, whose sidecars are easy to copy
  without). Set `BACKUP_DIR` to a durable location; the default still sits on
  the same ephemeral disk as the database, which protects against operator error
  only. Nothing schedules it yet.
- **T-11** (fixed): `refresh` issues a new `jti` without revoking the old, so
  logout used to kill only the most recent token while earlier ones lived to
  their natural `exp` (≤2 h). Logout now also stamps `users.tokens_valid_from`,
  and auth rejects any token whose `iat` predates it, so logging out ends every
  session for that account.

  Revoking the replaced token inside `refresh` looks like the obvious fix and
  breaks everyday use: session restore runs on every page load and rotates the
  shared cookie, so opening a second tab would revoke the first tab's token,
  and `httpClient` turns that 401 into a full logout. Measured, not assumed.
  Consequence of the chosen fix: logging out anywhere logs out everywhere.
  Residual: `iat` has one-second resolution, so a token minted in the same
  second as the logout survives; the presented token is also revoked by `jti`.
- **Rate limiting and lockout are process-local** — they reset on restart,
  which T-1 made trivially triggerable.
- **No monitoring** — none of the above would raise an alert today.
