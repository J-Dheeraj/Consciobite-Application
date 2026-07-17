# Contributing to Consciobite

## Development setup

```bash
# Backend
cd backend
cp .env.example .env          # fill in JWT_SECRET
npm install
npm run dev                   # http://localhost:4000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                   # http://localhost:3000

# Docker (both services together)
export JWT_SECRET=dev-secret-change-me
docker compose up --build
```

## Branches

Use one of these prefixes:

| Type | Pattern |
|------|---------|
| New feature | `feat/<short-name>` |
| Bug fix | `fix/<short-name>` |
| Maintenance | `chore/<short-name>` |

Branch off `main`. Keep branches small and focused on one concern.

## Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add barcode scan history
fix: correct carbon log delete endpoint
chore: upgrade better-sqlite3 to v12
docs: document GreenGrade methodology
refactor: extract score calculation into service
test: add integration tests for admin routes
```

Subject line under 72 characters. No period at the end.

## Pull requests

- One concern per PR.
- Backend API changes need updated Swagger docs.
- New routes need `validate()` middleware — use `pattern: /^\d+$/` for numeric query params, not `type: "number"`.
- New frontend pages use React Query for server state (no raw `useEffect` + `fetch`).
- Anything touching `greengrade.js` needs a test in `backend/__tests__/`.
- CI must pass (lint → format → tests → audit → Docker build) before merge.

## Testing

```bash
cd backend && npm test        # 153 backend tests
cd frontend && npm test       # smoke tests
```

Every new route needs at least one Supertest integration test. The test file lives in `backend/__tests__/`.

## Code style

Prettier and ESLint are enforced in CI. Run them locally before pushing:

```bash
cd backend && npx prettier --write . && npx eslint src --fix
cd frontend && npx prettier --write . && npx eslint src --fix
```

## Key constraints

- Never hardcode `JWT_SECRET` or commit `.env` files.
- Do not remove or loosen rate limiting, CORS restrictions, or account lockout settings.
- Do not add `console.log` to production code — use the Winston logger.
- The `/carbon` route is protected by `RequireAuth` — do not add in-page auth gates.
- `AUTH_EXPIRED_EVENT` is the shared constant for 401 events — never use the raw string.
- Docker containers run as non-root. Keep it that way.

## Architecture notes

See `CLAUDE.md` for a full overview of the stack, repo layout, and key invariants. See `wiki/hot.md` for recent context on active features.
