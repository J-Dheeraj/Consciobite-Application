---
type: domain
title: "Backend Security"
created: 2026-04-25
updated: 2026-04-25
status: mature
tags: [security, backend, validation, cors]
related: ["[[Validate Middleware Pattern]]", "[[validate() Middleware]]", "[[Product Catalog Schema]]", "[[Open Food Facts Integration]]"]
sources: ["[[.raw/graphify-audit-2026-04-25.md]]"]
---

# Backend Security

Security posture of the Consciobite Express API after the 2026-04-25 audit.

## Layers

### Input Validation
All public-facing routes now pass through `validate()` with explicit schemas. See [[Validate Middleware Pattern]].

### Authentication
- JWT HS256, 15-min expiry enforced client-side on mount
- Account lockout after 5 failed login attempts (`MAX_ATTEMPTS`, `LOCKOUT_MS` in auth.js)
- `requireAuth` middleware returns 401 on any JWT error (intentional, not a bug)
- `optionalAuth` proceeds without `req.user` when token is absent or invalid (intentional)

### CORS
- Exact-match allowlist via `ALLOWED_ORIGINS` env var (comma-separated)
- Regex allowlist via `ALLOWED_ORIGIN_PATTERN` env var (new, commit 8d50d17)
- Falls back to hardcoded Onrender pattern + localhost

### Rate Limiting (express-rate-limit)
- General API: 200 req/15 min
- Scan endpoint: 30 req/15 min
- Auth endpoints: 20 req/15 min

### Other Hardening
- `helmet()` security headers
- `hpp()` HTTP parameter pollution prevention
- Body size limit: 10 KB
- JSON parse errors return 400 (not 500)
- `x-powered-by` disabled

## Known Limitations / Non-Issues

- Cache key is `req.originalUrl` — acceptable because only `/api/products` and `/api/recipes` (both public) are cached. No per-user data at risk (B2 false positive confirmed).
