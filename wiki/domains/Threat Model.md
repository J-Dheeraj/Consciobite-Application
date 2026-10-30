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
| T-6 | **Tampering/Repudiation** — audit trail is mutable + ephemeral | `score_change_logs` | High | **Open — accepted** |
| T-7 | **Tampering** — CSRF gaps on two mutating surfaces | `DELETE /auth/account`, `/v1/evidence` POSTs | Medium | **Fixed in PR #50** |
| T-8 | **Info disclosure** — total data loss / no backup | ephemeral SQLite | High | **Open — known** |
| T-9 | **Tampering** — stored XSS via community evidence | `submitted_evidence` | Medium | Mitigated (escape + admin review) |
| T-10 | **DoS** — amplification through OFF | `/products/scan/:barcode` | Low | Mitigated (breaker + limiter) |
| T-11 | **Repudiation** — refresh doesn't revoke the old token | `refreshToken` | Low | **Open — by design** |

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

### T-6 · Audit-trail integrity — HIGH, open and accepted
`score_change_logs` is an ordinary mutable SQLite table on an ephemeral disk:
no append-only enforcement, no hash chaining, no signatures, no external
checkpoint, and `changed_by` is free text rather than an actor FK. Anyone with
DB or host access can rewrite history, and a redeploy can erase it. This is
the governance claim's own evidence, so it deserves the strongest integrity
guarantee in the system and currently has the weakest. README already describes
it as application-level rather than tamper-evident — the honest wording stands;
the capability gap remains.

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

- **T-6 and T-8 are architectural**, not bugs: durable storage and
  tamper-evident audit need managed Postgres + signed/chained records. Tracked
  in [[Production Readiness]].
- **T-11**: `refresh` issues a new `jti` without revoking the old, so logout
  kills only the most recent token; the prior one lives to its natural `exp`
  (≤2 h). Low, but surprising given a revocation registry exists.
- **Rate limiting and lockout are process-local** — they reset on restart,
  which T-1 made trivially triggerable.
- **No monitoring** — none of the above would raise an alert today.
