---
type: entity
title: "RequireAuth Guard"
created: 2026-04-25
updated: 2026-04-25
status: mature
tags: [auth, routing, frontend, react]
related: ["[[Auth-Expired Event Bus]]", "[[CarbonTracker Component]]"]
sources: ["[[.raw/graphify-audit-2026-04-25.md]]"]
---

# RequireAuth Guard

`frontend/src/App.js`

React Router v6 wrapper component that redirects unauthenticated users to `/login` before a protected page mounts.

## Implementation

```jsx
function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
```

## Protected Routes

```jsx
<Route path="/carbon" element={<RequireAuth><CarbonTracker /></RequireAuth>} />
```

## Pre-audit State

`CarbonTracker.js` had its own inline auth gate — a 46-line "sign in to continue" card rendered inside the component after mount. This meant the component had to run its data fetches (`queryFn`) conditionally via `enabled: isAuthenticated`. The distributed check was removed in commit 17779d2 in favour of this centralised guard.

## Benefit

Auth gate fires before any data fetching starts. Unauthenticated users never trigger network requests to protected endpoints.
