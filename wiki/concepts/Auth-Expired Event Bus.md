---
type: concept
title: "Auth-Expired Event Bus"
created: 2026-04-25
updated: 2026-04-25
status: mature
tags: [auth, event-bus, coupling, frontend]
related: ["[[validate() Middleware]]", "[[RequireAuth Guard]]", "[[Graphify Audit 2026-04-25]]"]
sources: ["[[.raw/graphify-audit-2026-04-25.md]]"]
---

# Auth-Expired Event Bus

A lightweight browser event bus that lets `api.js` trigger automatic logout in `AuthContext.js` without a direct import dependency between the two files.

## How It Works

1. `safeFetch()` in `frontend/src/services/api.js` detects any `401` response while a JWT token exists in localStorage.
2. It clears localStorage (`consciobite_token`, `consciobite_user`) and fires:
   ```js
   window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
   ```
3. `AuthProvider` in `frontend/src/context/AuthContext.js` registers a listener in a `useEffect`:
   ```js
   window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired)
   ```
4. `handleExpired` calls `logout()`, which clears React state.

## The Coupling Problem

Before the audit fix, both files used the raw string `"auth-expired"`. If one side was renamed without updating the other, the logout would silently stop working — the only symptom being sessions that never expire on the client after a token is revoked server-side.

The graphify knowledge graph flagged this: AST cannot see string equality across files, so the two nodes appeared to belong to disconnected communities despite being tightly coupled at runtime.

## Fix Applied (commit 8d50d17)

`AUTH_EXPIRED_EVENT = "auth-expired"` added to `frontend/src/utils/constants.js`. Both `api.js` and `AuthContext.js` now import it.

## Why This Pattern Exists

`api.js` cannot import `AuthContext.js` without creating a circular dependency (`AuthContext` already depends on `api.js` indirectly via page components). The event bus breaks the cycle cleanly without introducing a global store.
